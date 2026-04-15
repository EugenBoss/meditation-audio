/**
 * TTS Engine — ElevenLabs Integration
 * Generates audio for each meditation segment with phase-appropriate voice settings.
 * Includes retry logic, SSML preprocessing, and rate limit handling.
 */

import { PHASE_VOICE_CONFIG, RECOMMENDED_VOICES } from './meditation-prompts.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 2000;

// ═══════════════════════════════════════════════════════
// TEXT PREPROCESSING — Add SSML breaks for emphasis & pacing
// ═══════════════════════════════════════════════════════

/**
 * Preprocess text for TTS: add micro-pauses before emphasis words,
 * and intra-sentence breaks using SSML <break> tags.
 * Multilingual v2 supports SSML break tags (max 3s per tag).
 * @param {string} text - Raw text
 * @param {string[]} emphasisWords - Words to emphasize (add micro-pause before)
 * @param {string} phase - Meditation phase (affects pacing)
 * @returns {string} Preprocessed text with SSML
 */
function preprocessText(text, emphasisWords = [], phase = 'suggestions') {
  let processed = text;

  // Add micro-pause (0.4s) before emphasis words for vocal weight
  for (const word of emphasisWords) {
    const regex = new RegExp(`(\\s)(${escapeRegex(word)})`, 'gi');
    processed = processed.replace(regex, ' <break time="0.4s" /> $2');
  }

  // For deeper phases, add a subtle breath pause at commas (0.6s instead of natural)
  const deepPhases = ['deepening', 'suggestions', 'ego_strengthening'];
  if (deepPhases.includes(phase)) {
    // Replace commas with comma + short break for more deliberate pacing
    processed = processed.replace(/,\s/g, ', <break time="0.3s" /> ');
  }

  // Add medium pause at ellipsis (common in meditation scripts)
  processed = processed.replace(/\.\.\./g, '<break time="1.0s" />');

  return processed;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════
// SYNTHESIS WITH RETRY
// ═══════════════════════════════════════════════════════

/**
 * Generate audio for a single text segment with retry logic.
 * @param {string} text - Text to synthesize (may contain SSML)
 * @param {Object} voiceConfig - { stability, similarity_boost }
 * @param {string} voiceId - ElevenLabs voice ID
 * @param {string} modelId - ElevenLabs model ID
 * @returns {Buffer} MP3 audio buffer
 */
async function synthesizeSegment(text, voiceConfig, voiceId, modelId) {
  const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`;

  const body = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: voiceConfig.stability,
      similarity_boost: voiceConfig.similarity_boost,
      style: 0.12,              // Low style exaggeration — calm, consistent
      use_speaker_boost: false   // Disabled for meditation — cleaner, softer
    }
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(body)
      });

      // Rate limited — wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[TTS] Rate limited (429). Waiting ${waitMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await delay(waitMs);
        continue;
      }

      // Server error — retry with backoff
      if (response.status >= 500) {
        const waitMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[TTS] Server error (${response.status}). Waiting ${waitMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        await delay(waitMs);
        continue;
      }

      // Client error (except 429) — don't retry
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (err) {
      if (err.message.includes('ElevenLabs API error')) throw err; // Don't retry client errors

      if (attempt === MAX_RETRIES) {
        throw new Error(`ElevenLabs failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
      }

      const waitMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[TTS] Network error: ${err.message}. Waiting ${waitMs}ms...`);
      await delay(waitMs);
    }
  }

  throw new Error('ElevenLabs: exhausted all retries');
}

// ═══════════════════════════════════════════════════════
// SILENCE GENERATOR
// ═══════════════════════════════════════════════════════

/**
 * Generate precise silence of specified duration.
 * @param {number} durationMs - Duration in milliseconds
 * @param {string} outputPath - Where to save the silence file
 */
function generateSilence(durationMs, outputPath) {
  const durationSec = durationMs / 1000;
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} -q:a 9 "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════

/**
 * Process an entire meditation script into individual audio files.
 * @param {Object} script - Structured meditation script
 * @param {Object} opts
 * @param {string} opts.lang - 'ro' or 'en'
 * @param {string} opts.gender - 'female' or 'male'
 * @param {string} [opts.voiceId] - Custom voice ID override
 * @param {string} opts.workDir - Working directory for temp files
 * @param {Function} [opts.onProgress] - Progress callback (current, total, text)
 * @returns {string[]} Array of file paths in playback order (segments + silences)
 */
export async function processScript(script, { lang = 'ro', gender = 'female', voiceId, model, workDir, onProgress }) {
  // Select voice
  const selectedVoice = voiceId || RECOMMENDED_VOICES[lang]?.[gender]?.voice_id;
  if (!selectedVoice) {
    throw new Error(`No voice found for lang=${lang}, gender=${gender}`);
  }

  // Model: use provided or default to Multilingual v2
  const modelId = model || 'eleven_multilingual_v2';

  console.log(`[TTS] Voice: ${selectedVoice}, Model: ${modelId}, Lang: ${lang}`);

  // Ensure work directory exists
  await fs.mkdir(workDir, { recursive: true });

  const allFiles = [];
  let segmentIndex = 0;
  const totalSegments = script.phases.reduce((sum, p) => sum + p.segments.length, 0);
  let totalChars = 0;

  for (const phase of script.phases) {
    const phaseConfig = PHASE_VOICE_CONFIG[phase.phase] || PHASE_VOICE_CONFIG.suggestions;

    for (const segment of phase.segments) {
      segmentIndex++;
      const segFile = path.join(workDir, `seg_${String(segmentIndex).padStart(4, '0')}.mp3`);
      const silFile = path.join(workDir, `sil_${String(segmentIndex).padStart(4, '0')}.mp3`);

      if (onProgress) {
        onProgress(segmentIndex, totalSegments, segment.text.substring(0, 60));
      }

      console.log(`[TTS] [${phase.phase}] ${segmentIndex}/${totalSegments}: "${segment.text.substring(0, 50)}..."`);

      // Preprocess text with SSML for emphasis and pacing
      const processedText = preprocessText(
        segment.text,
        segment.emphasis_words || [],
        phase.phase
      );

      totalChars += segment.text.length;

      // Synthesize speech with retry
      const audioBuffer = await synthesizeSegment(
        processedText,
        {
          stability: phaseConfig.stability,
          similarity_boost: phaseConfig.similarity_boost
        },
        selectedVoice,
        modelId
      );

      await fs.writeFile(segFile, audioBuffer);
      allFiles.push(segFile);

      // Generate silence after segment
      const pauseDuration = segment.pause_after_ms || phaseConfig.pause_between_sentences_ms;
      if (pauseDuration > 0) {
        generateSilence(pauseDuration, silFile);
        allFiles.push(silFile);
      }

      // Inter-segment delay — respect ElevenLabs rate limits
      // Pro tier: ~10 req/s, Free: ~2 req/s
      await delay(350);
    }
  }

  const estimatedCost = (totalChars / 1_000_000 * 30).toFixed(3);
  console.log(`[TTS] Complete: ${segmentIndex} segments, ${totalChars} chars (~$${estimatedCost} ElevenLabs cost)`);
  console.log(`[TTS] Generated ${allFiles.length} files (${segmentIndex} audio + ${allFiles.length - segmentIndex} silences)`);

  return allFiles;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
