/**
 * Meditation Audio Generator — Server
 * Pipeline: Script (Claude) → TTS (ElevenLabs) → Assembly (FFmpeg) → Download
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import { generateScript } from './lib/script-generator.js';
import { processScript } from './lib/tts-engine.js';
import { assembleAudio, generateAmbientTrack } from './lib/audio-assembler.js';
import { RECOMMENDED_VOICES, DURATION_TEMPLATES } from './lib/meditation-prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// ═══════════════════════════════════════════════════════
// In-memory job tracker (for production: use Redis/Supabase)
// ═══════════════════════════════════════════════════════

const jobs = new Map();

// ═══════════════════════════════════════════════════════
// API: Health check (for Railway)
// ═══════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;

  res.json({
    status: hasAnthropic && hasElevenLabs ? 'ok' : 'misconfigured',
    anthropic_key: hasAnthropic ? 'set' : 'MISSING',
    elevenlabs_key: hasElevenLabs ? 'set' : 'MISSING',
    active_jobs: jobs.size,
    uptime_seconds: Math.round(process.uptime())
  });
});

// ═══════════════════════════════════════════════════════
// API: Start meditation generation
// ═══════════════════════════════════════════════════════

app.post('/api/generate', async (req, res) => {
  const { problem, lang = 'ro', duration = 'medium', name, category, gender = 'female', ambient = 'ocean', voiceId, model } = req.body;

  if (!problem || problem.trim().length < 5) {
    return res.status(400).json({ error: 'Problema/tema trebuie să aibă minim 5 caractere.' });
  }

  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    status: 'started',
    step: 'script',
    progress: 0,
    total: 0,
    currentText: '',
    createdAt: Date.now(),
    params: { problem, lang, duration, name, category, gender, ambient, voiceId, model },
    result: null,
    error: null
  };
  jobs.set(jobId, job);

  // Run pipeline async
  runPipeline(jobId).catch(err => {
    console.error(`[Pipeline] Fatal error for job ${jobId}:`, err);
    const j = jobs.get(jobId);
    if (j) {
      j.status = 'error';
      j.error = err.message;
    }
  });

  res.json({ jobId, status: 'started' });
});

// ═══════════════════════════════════════════════════════
// API: Check job status
// ═══════════════════════════════════════════════════════

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    id: job.id,
    status: job.status,
    step: job.step,
    progress: job.progress,
    total: job.total,
    currentText: job.currentText,
    result: job.result,
    error: job.error
  });
});

// ═══════════════════════════════════════════════════════
// API: Download generated audio
// ═══════════════════════════════════════════════════════

app.get('/api/download/:jobId', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.status !== 'done') {
    return res.status(404).json({ error: 'Audio not ready or job not found' });
  }

  const filePath = job.result.path;
  const fileName = job.result.filename;

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'audio/mpeg');

  const fileStream = await fs.readFile(filePath);
  res.send(fileStream);
});

// ═══════════════════════════════════════════════════════
// API: Get script only (preview without audio)
// ═══════════════════════════════════════════════════════

app.post('/api/preview-script', async (req, res) => {
  const { problem, lang = 'ro', duration = 'medium', name, category } = req.body;

  if (!problem || problem.trim().length < 5) {
    return res.status(400).json({ error: 'Problema/tema trebuie să aibă minim 5 caractere.' });
  }

  try {
    const script = await generateScript({ problem, lang, duration, name, category });
    res.json({ script });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// API: Available voices
// ═══════════════════════════════════════════════════════

app.get('/api/voices', (req, res) => {
  res.json(RECOMMENDED_VOICES);
});

// ═══════════════════════════════════════════════════════
// PIPELINE
// ═══════════════════════════════════════════════════════

async function runPipeline(jobId) {
  const job = jobs.get(jobId);
  const { problem, lang, duration, name, category, gender, ambient, voiceId, model } = job.params;

  const workDir = path.join(__dirname, 'output', jobId);
  await fs.mkdir(workDir, { recursive: true });

  // ── Step 1: Generate Script ──────────────────────────
  job.step = 'script';
  job.status = 'processing';
  console.log(`\n[Pipeline ${jobId}] Step 1: Generating script...`);

  const script = await generateScript({ problem, lang, duration, name, category });

  // Save script for reference
  await fs.writeFile(
    path.join(workDir, 'script.json'),
    JSON.stringify(script, null, 2),
    'utf8'
  );

  const totalSegments = script.phases.reduce((sum, p) => sum + p.segments.length, 0);
  job.total = totalSegments;
  console.log(`[Pipeline ${jobId}] Script ready: ${totalSegments} segments`);

  // ── Step 2: TTS ──────────────────────────────────────
  job.step = 'tts';
  console.log(`[Pipeline ${jobId}] Step 2: Generating audio (${totalSegments} segments)...`);

  const audioFiles = await processScript(script, {
    lang,
    gender,
    voiceId,
    model,
    workDir,
    onProgress: (current, total, text) => {
      job.progress = current;
      job.total = total;
      job.currentText = text;
    }
  });

  // ── Step 3: Generate ambient track (optional) ────────
  let ambientPath = null;
  if (ambient && ambient !== 'none') {
    job.step = 'ambient';
    console.log(`[Pipeline ${jobId}] Step 3: Generating ambient track (${ambient})...`);

    // Estimate total duration from segments + pauses
    const estimatedDuration = totalSegments * 8; // rough: 8 sec avg per segment+pause
    ambientPath = path.join(workDir, 'ambient.mp3');
    await generateAmbientTrack(estimatedDuration + 30, ambientPath, ambient);
  }

  // ── Step 4: Assemble final audio ─────────────────────
  job.step = 'assembly';
  console.log(`[Pipeline ${jobId}] Step 4: Assembling final audio...`);

  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedProblem = problem.substring(0, 30).replace(/[^a-zA-Z0-9ăâîșțĂÂÎȘȚ ]/g, '').trim().replace(/\s+/g, '_');
  const filename = `meditatie_${sanitizedProblem}_${lang}_${duration}_${timestamp}.mp3`;
  const outputPath = path.join(workDir, filename);

  const result = await assembleAudio(audioFiles, outputPath, {
    backgroundAudio: ambientPath,
    backgroundVolume: 0.08,
    normalize: true,
    fadeInSec: 2,
    fadeOutSec: 4
  });

  // ── Step 5: Cleanup temp segment files ───────────────
  job.step = 'cleanup';
  for (const f of audioFiles) {
    try { await fs.unlink(f); } catch { /* ignore */ }
  }
  if (ambientPath) {
    try { await fs.unlink(ambientPath); } catch { /* ignore */ }
  }

  // ── Done ─────────────────────────────────────────────
  job.status = 'done';
  job.step = 'done';
  job.result = {
    path: outputPath,
    filename,
    duration_minutes: result.duration_minutes,
    size_mb: result.size_mb,
    script_title: script.title,
    download_url: `/api/download/${jobId}`
  };

  console.log(`\n[Pipeline ${jobId}] ✅ DONE — ${filename} (${result.duration_minutes} min, ${result.size_mb} MB)`);
}

// ═══════════════════════════════════════════════════════
// Cleanup old jobs (every hour)
// ═══════════════════════════════════════════════════════

setInterval(async () => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  for (const [id, job] of jobs) {
    if (now - job.createdAt > ONE_HOUR * 24) {
      // Delete files
      const workDir = path.join(__dirname, 'output', id);
      try { await fs.rm(workDir, { recursive: true, force: true }); } catch { /* ignore */ }
      jobs.delete(id);
    }
  }
}, 60 * 60 * 1000);

// ═══════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🧘 Meditation Audio Generator running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT}\n`);
});
