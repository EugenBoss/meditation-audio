/**
 * Script Generator — Claude API Integration
 * Generates structured meditation scripts with phase-by-phase segments.
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserPrompt } from './meditation-prompts.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a structured meditation script.
 * @param {Object} opts
 * @param {string} opts.problem - The therapeutic theme/problem
 * @param {string} opts.lang - 'ro' or 'en'
 * @param {string} opts.duration - 'short'|'medium'|'long'|'extended'
 * @param {string} [opts.name] - User's first name (optional)
 * @param {string} [opts.category] - Therapeutic category (optional)
 * @returns {Object} Structured meditation script JSON
 */
export async function generateScript({ problem, lang = 'ro', duration = 'medium', name, category }) {
  console.log(`[ScriptGen] Generating ${duration} ${lang} script for: "${problem}"`);

  const systemPrompt = buildSystemPrompt(lang);
  const userPrompt = buildUserPrompt({ problem, lang, duration, name, category });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  // Clean and parse JSON
  const cleaned = rawText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let script;
  try {
    script = JSON.parse(cleaned);
  } catch (err) {
    console.error('[ScriptGen] JSON parse error. Raw output:', rawText.substring(0, 500));
    throw new Error(`Script generation returned invalid JSON: ${err.message}`);
  }

  // Validate structure
  if (!script.phases || !Array.isArray(script.phases)) {
    throw new Error('Script missing "phases" array');
  }

  for (const phase of script.phases) {
    if (!phase.segments || !Array.isArray(phase.segments)) {
      throw new Error(`Phase "${phase.phase}" missing "segments" array`);
    }
    for (const seg of phase.segments) {
      if (!seg.text || typeof seg.text !== 'string') {
        throw new Error(`Segment in phase "${phase.phase}" missing "text"`);
      }
      // Ensure pause_after_ms exists with default
      if (!seg.pause_after_ms || typeof seg.pause_after_ms !== 'number') {
        seg.pause_after_ms = 3000;
      }
    }
  }

  // Count total segments
  const totalSegments = script.phases.reduce((sum, p) => sum + p.segments.length, 0);
  console.log(`[ScriptGen] Generated ${script.phases.length} phases, ${totalSegments} segments`);

  return script;
}
