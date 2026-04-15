/**
 * TTS Engine v3 — ElevenLabs Integration
 * 
 * Strategy: ONE segment per TTS call + precise silence between segments.
 * 
 * Why per-segment works now:
 * - The designed voice has high stability (0.85+), so it's consistent across calls
 * - Silence files between segments give PRECISE pause control (not model-dependent)
 * - No SSML — just text formatting cues the model understands naturally
 * 
 * Pacing tricks (no SSML needed):
 * - Trailing "..." → model slows down, trails off naturally
 * - CAPITALIZED words → model adds emphasis/weight
 * - Shorter sentences → model reads each one as a complete thought with natural end-pause
 * - Explicit silence files → guaranteed pauses of exact duration
 */

import { PHASE_VOICE_CONFIG, RECOMMENDED_VOICES } from './meditation-prompts.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 2000;

// ═══════════════════════════════════════════════════════
// TEXT FORMATTING — no SSML, just natural cues
// ═══════════════════════════════════════════════════════

/**
 * Format segment text for optimal TTS delivery:
 * - CAPITALIZE emphasis words (ElevenLabs renders these with more weight)
 * - Add trailing "..." if not present (signals model to slow/trail off)
 * - Clean up whitespace
 */
function formatForTTS(text, emphasisWords = []) {
  let formatted = text.trim();

  // Capitalize emphasis words (case-insensitive match, preserve position)
  for (const word of emphasisWords) {
    const regex = new RegExp(`\\b(${escapeRegex(word)})\\b`, 'gi');
    formatted = formatted.replace(regex, (match) => match.toUpperCase());
  }

  // If sentence doesn't end with ..., add it for trailing-off effect
  // This makes the model slow down at the end of each segment
  if (!formatted.endsWith('...') && !formatted.endsWith('…')) {
    // Remove existing period/comma at end, replace with ...
    formatted = formatted.replace(/[.,;:!?]+$/, '');
    formatted += '...';
  }

  return formatted;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════
// SYNTHESIS WITH RETRY
// ═══════════════════════════════════════════════════════

async function synthesizeText(text, voiceConfig, voiceId, modelId) {
  const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`;

  const body = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: voiceConfig.stability,
      similarity_boost: voiceConfig.similarity_boost,
      style: 0.05,
      use_speaker_boost: false
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

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[TTS] Rate limited. Waiting ${waitMs}ms... (attempt ${attempt + 1})`);
        await delay(waitMs);
        continue;
      }

      if (response.status >= 500) {
        const waitMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[TTS] Server error (${response.status}). Waiting ${waitMs}ms...`);
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (err) {
      if (err.message.includes('ElevenLabs API error')) throw err;
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

function generateSilence(durationMs, outputPath) {
  const durationSec = durationMs / 1000;
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} -q:a 9 "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PIPELINE — per-segment with precise pauses
// ═══════════════════════════════════════════════════════

export async function processScript(script, { lang = 'ro', gender = 'female', voiceId, model, workDir, onProgress }) {
  const selectedVoice = voiceId || RECOMMENDED_VOICES[lang]?.[gender]?.voice_id;
  if (!selectedVoice) {
    throw new Error(`No voice found for lang=${lang}, gender=${gender}`);
  }

  const modelId = model || 'eleven_multilingual_v2';
  console.log(`[TTS] Voice: ${selectedVoice}, Model: ${modelId}, Lang: ${lang}`);

  await fs.mkdir(workDir, { recursive: true });

  const allFiles = [];
  let segmentIndex = 0;
  let totalChars = 0;
  const totalSegments = script.phases.reduce((sum, p) => sum + p.segments.length, 0);

  for (const phase of script.phases) {
    const phaseConfig = PHASE_VOICE_CONFIG[phase.phase] || PHASE_VOICE_CONFIG.suggestions;

    for (const segment of phase.segments) {
      segmentIndex++;

      const audioFile = path.join(workDir, `seg_${String(segmentIndex).padStart(4, '0')}.mp3`);
      const silFile = path.join(workDir, `sil_${String(segmentIndex).padStart(4, '0')}.mp3`);

      if (onProgress) {
        onProgress(segmentIndex, totalSegments, segment.text.substring(0, 60));
      }

      // Format text: CAPITALIZE emphasis words + add trailing "..."
      const formatted = formatForTTS(segment.text, segment.emphasis_words || []);
      totalChars += formatted.length;

      console.log(`[TTS] [${phase.phase}] ${segmentIndex}/${totalSegments}: "${formatted.substring(0, 55)}..."`);

      // Synthesize ONE segment
      const audioBuffer = await synthesizeText(
        formatted,
        {
          stability: phaseConfig.stability,
          similarity_boost: phaseConfig.similarity_boost
        },
        selectedVoice,
        modelId
      );

      await fs.writeFile(audioFile, audioBuffer);
      allFiles.push(audioFile);

      // PRECISE silence after this segment
      const pauseMs = segment.pause_after_ms || phaseConfig.pause_between_sentences_ms;
      if (pauseMs > 0) {
        generateSilence(pauseMs, silFile);
        allFiles.push(silFile);
      }

      // Rate limit delay
      await delay(350);
    }

    // Phase transition silence (extra pause between phases)
    const phaseTransitions = {
      preparation: 4000,
      induction: 6000,
      deepening: 10000,
      suggestions: 8000,
      ego_strengthening: 6000,
      post_hypnotic: 5000,
      reorientation: 0
    };

    const transitionMs = phaseTransitions[phase.phase] || 4000;
    if (transitionMs > 0) {
      const transSilFile = path.join(workDir, `trans_${phase.phase}.mp3`);
      generateSilence(transitionMs, transSilFile);
      allFiles.push(transSilFile);
    }
  }

  const estimatedCost = (totalChars / 1_000_000 * 30).toFixed(3);
  console.log(`[TTS] Done: ${totalSegments} segments, ${totalChars} chars (~$${estimatedCost})`);

  return allFiles;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
