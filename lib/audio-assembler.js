/**
 * Audio Assembler — FFmpeg Post-Processing
 * Concatenates segments, normalizes volume, optionally mixes background audio.
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Concatenate multiple audio files into one.
 * @param {string[]} files - Ordered array of audio file paths
 * @param {string} outputPath - Final output file path
 * @param {Object} [opts]
 * @param {string} [opts.backgroundAudio] - Path to ambient background audio file
 * @param {number} [opts.backgroundVolume] - Background volume (0.0-1.0, default 0.08)
 * @param {boolean} [opts.normalize] - Apply LUFS normalization (default true)
 * @param {number} [opts.fadeInSec] - Fade-in duration in seconds (default 2)
 * @param {number} [opts.fadeOutSec] - Fade-out duration in seconds (default 3)
 */
export async function assembleAudio(files, outputPath, opts = {}) {
  const {
    backgroundAudio = null,
    backgroundVolume = 0.08,
    normalize = true,
    fadeInSec = 2,
    fadeOutSec = 3
  } = opts;

  const workDir = path.dirname(outputPath);
  const concatListPath = path.join(workDir, 'concat_list.txt');
  const rawConcatPath = path.join(workDir, '_raw_concat.mp3');
  const normalizedPath = path.join(workDir, '_normalized.mp3');

  // Step 1: Create FFmpeg concat file list
  const concatContent = files
    .map(f => `file '${f}'`)
    .join('\n');
  await fs.writeFile(concatListPath, concatContent);

  console.log(`[Assembler] Concatenating ${files.length} files...`);

  // Step 2: Concatenate all segments
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -acodec libmp3lame -q:a 2 "${rawConcatPath}"`,
    { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
  );

  // Get total duration
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${rawConcatPath}"`,
    { encoding: 'utf8' }
  ).trim();
  const totalDuration = parseFloat(durationStr);
  console.log(`[Assembler] Total duration: ${(totalDuration / 60).toFixed(1)} minutes`);

  let currentInput = rawConcatPath;

  // Step 3: Mix with background audio (if provided)
  if (backgroundAudio) {
    const mixedPath = path.join(workDir, '_mixed.mp3');

    // Background: loop to match voice duration, set volume, mix
    execSync(
      `ffmpeg -y -i "${currentInput}" -stream_loop -1 -i "${backgroundAudio}" ` +
      `-filter_complex "[1:a]volume=${backgroundVolume},atrim=0:${totalDuration}[bg];` +
      `[0:a][bg]amix=inputs=2:duration=first:dropout_transition=3[out]" ` +
      `-map "[out]" -acodec libmp3lame -q:a 2 "${mixedPath}"`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    currentInput = mixedPath;
    console.log(`[Assembler] Mixed with background audio (volume: ${backgroundVolume})`);
  }

  // Step 4: Apply fade in/out + normalization
  const filters = [];

  if (fadeInSec > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeInSec}`);
  }
  if (fadeOutSec > 0) {
    const fadeOutStart = Math.max(0, totalDuration - fadeOutSec);
    filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOutSec}`);
  }
  if (normalize) {
    // LUFS -16 is standard for podcasts/meditations
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  }

  if (filters.length > 0) {
    const filterChain = filters.join(',');
    execSync(
      `ffmpeg -y -i "${currentInput}" -af "${filterChain}" -acodec libmp3lame -q:a 2 "${normalizedPath}"`,
      { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 }
    );
    currentInput = normalizedPath;
    console.log(`[Assembler] Applied: ${filters.join(' + ')}`);
  }

  // Step 5: Move to final output
  await fs.copyFile(currentInput, outputPath);

  // Step 6: Cleanup temp files
  const tempFiles = [concatListPath, rawConcatPath, normalizedPath, path.join(workDir, '_mixed.mp3')];
  for (const f of tempFiles) {
    try { await fs.unlink(f); } catch { /* ignore */ }
  }

  // Get final file size
  const stat = await fs.stat(outputPath);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
  console.log(`[Assembler] Final output: ${outputPath} (${sizeMB} MB, ${(totalDuration / 60).toFixed(1)} min)`);

  return {
    path: outputPath,
    duration_seconds: totalDuration,
    duration_minutes: Math.round(totalDuration / 60 * 10) / 10,
    size_mb: parseFloat(sizeMB)
  };
}

/**
 * Generate a simple ambient background track using FFmpeg.
 * Creates a soft pink noise + sine tone combination.
 * @param {number} durationSec - Duration in seconds
 * @param {string} outputPath - Output file path
 * @param {string} [type] - 'nature'|'ocean'|'rain'|'silence'
 */
export async function generateAmbientTrack(durationSec, outputPath, type = 'ocean') {
  // Generate different ambient textures using FFmpeg audio filters
  const configs = {
    ocean: {
      // Brown noise (deeper) filtered to sound oceanic
      filter: `anoisesrc=d=${durationSec}:c=brown:r=44100,lowpass=f=400,volume=0.3`
    },
    nature: {
      // Pink noise filtered for nature-like ambience
      filter: `anoisesrc=d=${durationSec}:c=pink:r=44100,lowpass=f=800,highpass=f=100,volume=0.2`
    },
    rain: {
      // White noise filtered for rain-like sound
      filter: `anoisesrc=d=${durationSec}:c=white:r=44100,lowpass=f=2000,highpass=f=500,volume=0.15`
    },
    silence: {
      filter: `anullsrc=r=44100:cl=stereo,atrim=0:${durationSec}`
    }
  };

  const config = configs[type] || configs.ocean;

  execSync(
    `ffmpeg -y -f lavfi -i "${config.filter}" -t ${durationSec} -acodec libmp3lame -q:a 5 "${outputPath}"`,
    { stdio: 'pipe' }
  );

  console.log(`[Ambient] Generated ${type} track: ${durationSec}s`);
}
