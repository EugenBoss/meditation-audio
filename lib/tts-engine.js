/**
 * TTS Engine — ElevenLabs Integration v2
 * 
 * Key changes from v1:
 * - NO SSML tags — they cause choppy robotic output. Let the model breathe naturally.
 * - Segments BATCHED per phase — sends 3-5 sentences as one block for vocal continuity.
 * - Silence inserted BETWEEN batches only, not between every sentence.
 * - Higher stability for meditation (0.80-0.92).
 * - Ellipsis in text preserved as natural pause cue for the model.
 */

import { PHASE_VOICE_CONFIG, RECOMMENDED_VOICES } from './meditation-prompts.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 2000;

// Max segments to batch into one TTS call.
// More = better continuity, but longer per request.
const BATCH_SIZE = 4;

// ═══════════════════════════════════════════════════════
// SYNTHESIS WITH RETRY (no SSML, plain text)
// ═══════════════════════════════════════════════════════

async function synthesizeText(text, voiceConfig, voiceId, modelId) {
  const url = `${ELEVENLABS_BASE}/text-to-speech/${voiceId}`;

  const body = {
    text,
    model_id: modelId,
    voice_settings: {
      stability: voiceConfig.stability,
      similarity_boost: voiceConfig.similarity_boost,
      style: 0.05,              // Near-zero — calm, no drama
      use_speaker_boost: false   // Off — cleaner, softer for meditation
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
        console.warn(`[TTS] Rate limited (429). Waiting ${waitMs}ms... (attempt ${attempt + 1})`);
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
// BATCH SEGMENTS INTO COHERENT TEXT BLOCKS
// ═══════════════════════════════════════════════════════

/**
 * Groups segments into batches for a single TTS call each.
 * Each batch = multiple sentences sent as one text block.
 * This gives ElevenLabs proper context for intonation and flow.
 * 
 * After each batch: insert the LAST segment's pause_after_ms as silence.
 * Between batches within a phase: use a standard inter-batch pause.
 */
function batchSegments(segments, batchSize = BATCH_SIZE) {
  const batches = [];
  for (let i = 0; i < segments.length; i += batchSize) {
    const batchSegs = segments.slice(i, i + batchSize);
    
    // Combine text with natural spacing (double newline = breath cue for model)
    const combinedText = batchSegs.map(s => s.text).join('\n\n');
    
    // Pause after this batch = the last segment's pause (deepest pause in batch)
    const maxPause = Math.max(...batchSegs.map(s => s.pause_after_ms || 3000));
    
    batches.push({
      text: combinedText,
      pause_after_ms: maxPause,
      segment_count: batchSegs.length,
      first_text: batchSegs[0].text.substring(0, 50)
    });
  }
  return batches;
}

// ═══════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════

/**
 * Process an entire meditation script into audio files.
 * Segments are batched per phase for vocal continuity.
 */
export async function processScript(script, { lang = 'ro', gender = 'female', voiceId, model, workDir, onProgress }) {
  const selectedVoice = voiceId || RECOMMENDED_VOICES[lang]?.[gender]?.voice_id;
  if (!selectedVoice) {
    throw new Error(`No voice found for lang=${lang}, gender=${gender}`);
  }

  const modelId = model || 'eleven_multilingual_v2';
  console.log(`[TTS] Voice: ${selectedVoice}, Model: ${modelId}, Lang: ${lang}`);

  await fs.mkdir(workDir, { recursive: true });

  const allFiles = [];
  let batchIndex = 0;
  let totalChars = 0;

  // Count total batches for progress
  let totalBatches = 0;
  for (const phase of script.phases) {
    totalBatches += Math.ceil(phase.segments.length / BATCH_SIZE);
  }

  // Also count original segments for progress display
  const totalSegments = script.phases.reduce((sum, p) => sum + p.segments.length, 0);
  let processedSegments = 0;

  for (const phase of script.phases) {
    const phaseConfig = PHASE_VOICE_CONFIG[phase.phase] || PHASE_VOICE_CONFIG.suggestions;
    const batches = batchSegments(phase.segments);

    console.log(`[TTS] Phase "${phase.phase}": ${phase.segments.length} segments → ${batches.length} batches`);

    for (const batch of batches) {
      batchIndex++;
      processedSegments += batch.segment_count;

      const audioFile = path.join(workDir, `batch_${String(batchIndex).padStart(4, '0')}.mp3`);
      const silFile = path.join(workDir, `sil_${String(batchIndex).padStart(4, '0')}.mp3`);

      if (onProgress) {
        onProgress(processedSegments, totalSegments, batch.first_text);
      }

      console.log(`[TTS] Batch ${batchIndex}/${totalBatches} (${batch.segment_count} segs): "${batch.first_text}..."`);

      totalChars += batch.text.length;

      // Synthesize the entire batch as one text block
      const audioBuffer = await synthesizeText(
        batch.text,
        {
          stability: phaseConfig.stability,
          similarity_boost: phaseConfig.similarity_boost
        },
        selectedVoice,
        modelId
      );

      await fs.writeFile(audioFile, audioBuffer);
      allFiles.push(audioFile);

      // Silence after batch
      if (batch.pause_after_ms > 0) {
        generateSilence(batch.pause_after_ms, silFile);
        allFiles.push(silFile);
      }

      // Rate limit delay between batches
      await delay(400);
    }

    // Extra pause between phases (transition)
    const phaseTransitionMs = {
      preparation: 3000,
      induction: 5000,
      deepening: 8000,
      suggestions: 6000,
      ego_strengthening: 5000,
      post_hypnotic: 4000,
      reorientation: 0
    };

    const transitionPause = phaseTransitionMs[phase.phase] || 3000;
    if (transitionPause > 0) {
      const transSilFile = path.join(workDir, `trans_${phase.phase}.mp3`);
      generateSilence(transitionPause, transSilFile);
      allFiles.push(transSilFile);
    }
  }

  const estimatedCost = (totalChars / 1_000_000 * 30).toFixed(3);
  console.log(`[TTS] Done: ${batchIndex} batches (${totalSegments} segments), ${totalChars} chars (~$${estimatedCost})`);

  return allFiles;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
