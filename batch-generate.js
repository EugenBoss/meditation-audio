/**
 * Batch Meditation Generator
 * Generates meditations for multiple categories, languages, and durations.
 * 
 * Usage:
 *   node batch-generate.js                    # All categories, RO+EN, medium duration
 *   node batch-generate.js --lang ro          # Only Romanian
 *   node batch-generate.js --cat anxietate    # Only anxiety category
 *   node batch-generate.js --duration short   # Only 5-min meditations
 *   node batch-generate.js --dry-run          # Preview what would be generated
 */

import { generateScript } from './lib/script-generator.js';
import { processScript } from './lib/tts-engine.js';
import { assembleAudio, generateAmbientTrack } from './lib/audio-assembler.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════
// CATEGORY DEFINITIONS — mapped to PM 12 categories
// ═══════════════════════════════════════════════════════

const CATEGORIES = {
  anxietate: {
    ro: 'Anxietate și atacuri de panică — eliberare de frici, calm profund, siguranță interioară',
    en: 'Anxiety and panic attacks — releasing fears, deep calm, inner safety'
  },
  stima_de_sine: {
    ro: 'Stimă de sine și încredere — valoare personală, curaj, acceptare de sine',
    en: 'Self-esteem and confidence — personal worth, courage, self-acceptance'
  },
  somn: {
    ro: 'Somn profund și liniștit — adormire ușoară, noapte fără treziri, odihnă completă',
    en: 'Deep restful sleep — easy falling asleep, uninterrupted night, complete rest'
  },
  trauma: {
    ro: 'Vindecare interioară și copilul interior — eliberare de durere, reconstrucție, compasiune',
    en: 'Inner healing and inner child — releasing pain, rebuilding, compassion'
  },
  depresie: {
    ro: 'Stare de bine și sens — reconectare cu bucuria, motivație, lumină interioară',
    en: 'Wellbeing and meaning — reconnecting with joy, motivation, inner light'
  },
  burnout: {
    ro: 'Recuperare energie și echilibru — reîncărcare, limite sănătoase, regenerare',
    en: 'Energy recovery and balance — recharging, healthy boundaries, regeneration'
  },
  motivatie: {
    ro: 'Motivație și acțiune — depășire blocaje, focalizare, energie de a face',
    en: 'Motivation and action — overcoming blocks, focus, energy to act'
  },
  relatii: {
    ro: 'Relații sănătoase și atașament securizant — comunicare, încredere, deschidere',
    en: 'Healthy relationships and secure attachment — communication, trust, openness'
  },
  dependente: {
    ro: 'Eliberare de obiceiuri și dependențe — libertate, control, alegere conștientă',
    en: 'Freedom from habits and dependencies — liberation, control, conscious choice'
  },
  bani: {
    ro: 'Abundență și securitate materială — relație sănătoasă cu banii, prosperitate',
    en: 'Abundance and material security — healthy relationship with money, prosperity'
  },
  sanatate: {
    ro: 'Sănătate fizică și energie vitală — vindecare, vitalitate, armonie corp-minte',
    en: 'Physical health and vital energy — healing, vitality, mind-body harmony'
  },
  vindecare: {
    ro: 'Vindecare generală și transformare — pace interioară, putere personală, renaștere',
    en: 'General healing and transformation — inner peace, personal power, rebirth'
  }
};

// ═══════════════════════════════════════════════════════
// PARSE CLI ARGS
// ═══════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    lang: null,        // null = both
    category: null,    // null = all
    duration: 'medium',
    gender: 'female',
    ambient: 'ocean',
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lang': opts.lang = args[++i]; break;
      case '--cat': case '--category': opts.category = args[++i]; break;
      case '--duration': opts.duration = args[++i]; break;
      case '--gender': opts.gender = args[++i]; break;
      case '--ambient': opts.ambient = args[++i]; break;
      case '--dry-run': opts.dryRun = true; break;
    }
  }

  return opts;
}

// ═══════════════════════════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════════════════════════

async function main() {
  const opts = parseArgs();

  const languages = opts.lang ? [opts.lang] : ['ro', 'en'];
  const categories = opts.category
    ? { [opts.category]: CATEGORIES[opts.category] }
    : CATEGORIES;

  if (opts.category && !CATEGORIES[opts.category]) {
    console.error(`Unknown category: ${opts.category}`);
    console.error(`Available: ${Object.keys(CATEGORIES).join(', ')}`);
    process.exit(1);
  }

  const totalJobs = Object.keys(categories).length * languages.length;
  console.log(`\n🧘 Batch Meditation Generator`);
  console.log(`   Categories: ${Object.keys(categories).length}`);
  console.log(`   Languages: ${languages.join(', ')}`);
  console.log(`   Duration: ${opts.duration}`);
  console.log(`   Gender: ${opts.gender}`);
  console.log(`   Ambient: ${opts.ambient}`);
  console.log(`   Total meditations: ${totalJobs}`);
  console.log(`   Estimated cost: ~$${(totalJobs * 0.33).toFixed(2)}\n`);

  if (opts.dryRun) {
    console.log('--- DRY RUN — would generate: ---');
    for (const [catKey, catLabels] of Object.entries(categories)) {
      for (const lang of languages) {
        console.log(`  [${lang.toUpperCase()}] ${catKey}: ${catLabels[lang]}`);
      }
    }
    console.log('\nAdd --no-dry-run or remove --dry-run to generate.');
    return;
  }

  // Check API keys
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY environment variable');
    process.exit(1);
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('Missing ELEVENLABS_API_KEY environment variable');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, 'output', 'batch');
  await fs.mkdir(outputDir, { recursive: true });

  const results = [];
  let completed = 0;

  for (const [catKey, catLabels] of Object.entries(categories)) {
    for (const lang of languages) {
      completed++;
      const label = `[${completed}/${totalJobs}] ${lang.toUpperCase()} / ${catKey}`;

      console.log(`\n${'═'.repeat(60)}`);
      console.log(`${label}`);
      console.log(`${'═'.repeat(60)}`);

      try {
        const problem = catLabels[lang];
        const workDir = path.join(outputDir, `${catKey}_${lang}`);
        await fs.mkdir(workDir, { recursive: true });

        // 1. Generate script
        console.log(`${label} → Generating script...`);
        const script = await generateScript({
          problem,
          lang,
          duration: opts.duration,
          category: catKey
        });

        await fs.writeFile(
          path.join(workDir, 'script.json'),
          JSON.stringify(script, null, 2),
          'utf8'
        );

        // 2. TTS
        console.log(`${label} → Synthesizing audio...`);
        const audioFiles = await processScript(script, {
          lang,
          gender: opts.gender,
          workDir
        });

        // 3. Ambient
        let ambientPath = null;
        if (opts.ambient !== 'none') {
          const estDuration = script.phases.reduce(
            (sum, p) => sum + p.segments.length * 8, 0
          );
          ambientPath = path.join(workDir, 'ambient.mp3');
          await generateAmbientTrack(estDuration + 30, ambientPath, opts.ambient);
        }

        // 4. Assemble
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `meditatie_${catKey}_${lang}_${opts.duration}_${timestamp}.mp3`;
        const outputPath = path.join(outputDir, filename);

        const result = await assembleAudio(audioFiles, outputPath, {
          backgroundAudio: ambientPath,
          backgroundVolume: 0.08,
          normalize: true,
          fadeInSec: 2,
          fadeOutSec: 4
        });

        // Cleanup work dir
        await fs.rm(workDir, { recursive: true, force: true });

        results.push({
          category: catKey,
          lang,
          filename,
          duration_min: result.duration_minutes,
          size_mb: result.size_mb,
          status: 'ok'
        });

        console.log(`${label} ✅ ${filename} (${result.duration_minutes} min)`);

      } catch (err) {
        console.error(`${label} ❌ ERROR: ${err.message}`);
        results.push({
          category: catKey,
          lang,
          filename: null,
          status: 'error',
          error: err.message
        });
      }

      // Cooldown between meditations (avoid rate limits)
      console.log(`${label} → Cooldown 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // ── Summary ──────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`BATCH COMPLETE`);
  console.log(`${'═'.repeat(60)}`);

  const ok = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status === 'error');

  console.log(`\n✅ Success: ${ok.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    for (const f of failed) {
      console.log(`   - ${f.lang}/${f.category}: ${f.error}`);
    }
  }

  console.log(`\nGenerated files:`);
  for (const r of ok) {
    console.log(`  📁 ${r.filename} (${r.duration_min} min, ${r.size_mb} MB)`);
  }

  // Save report
  const reportPath = path.join(outputDir, `batch_report_${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n📊 Report: ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
