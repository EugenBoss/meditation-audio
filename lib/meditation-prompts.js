/**
 * Meditation Script Generation Prompts
 * Encodes all Puterea Minții hypnosis knowledge for audio meditation generation.
 * 
 * Sources: Hammond (1990), Yapko (2021), Erickson CP, Zeig (2014),
 * Eugen Popa (5 Elemente Scenariu), Gilligan (1987), Rossi (1986),
 * Lankton (1983), Bandler & Grinder (1975-1981)
 */

// ═══════════════════════════════════════════════════════
// VOICE PARAMETERS PER MEDITATION PHASE
// ═══════════════════════════════════════════════════════

export const PHASE_VOICE_CONFIG = {
  preparation: {
    stability: 0.82,
    similarity_boost: 0.75,
    pause_between_sentences_ms: 3500,
    cacheable: true,
    description: 'Calm, welcoming, natural pace — settling in'
  },
  induction: {
    stability: 0.88,
    similarity_boost: 0.75,
    pause_between_sentences_ms: 5000,
    cacheable: true,
    description: 'Slower, softer, progressive relaxation — guiding down'
  },
  deepening: {
    stability: 0.92,
    similarity_boost: 0.78,
    pause_between_sentences_ms: 7000,
    cacheable: true,
    description: 'Slowest, softest, maximum stability — deep trance'
  },
  suggestions: {
    stability: 0.85,
    similarity_boost: 0.78,
    pause_between_sentences_ms: 5500,
    cacheable: false,
    description: 'Stable but warm, emphasis on key words, emotional depth'
  },
  ego_strengthening: {
    stability: 0.82,
    similarity_boost: 0.76,
    pause_between_sentences_ms: 5000,
    cacheable: false,
    description: 'Slightly warmer, conviction, identity-level'
  },
  post_hypnotic: {
    stability: 0.84,
    similarity_boost: 0.75,
    pause_between_sentences_ms: 4000,
    cacheable: false,
    description: 'Bridging to daily life, gentle anchoring'
  },
  reorientation: {
    stability: 0.78,
    similarity_boost: 0.72,
    pause_between_sentences_ms: 3000,
    cacheable: false,
    description: 'Gradually brighter, more energy, returning'
  }
};

// ═══════════════════════════════════════════════════════
// INTEGRATION PAUSE DURATIONS (silence between phases)
// ═══════════════════════════════════════════════════════

export const PHASE_TRANSITIONS = {
  after_preparation: 3000,
  after_induction: 5000,
  after_deepening: 8000,
  after_suggestions: 6000,
  after_ego_strengthening: 5000,
  after_post_hypnotic: 4000,
  integration_pause: 10000,
  breathing_pause: 6000,
};

// ═══════════════════════════════════════════════════════
// RECOMMENDED VOICES PER LANGUAGE
// ═══════════════════════════════════════════════════════

export const RECOMMENDED_VOICES = {
  ro: {
    female: {
      voice_id: 'Bawt8oEycTxqH0gysIwO',
      name: 'PM Meditation',
      note: 'Custom designed — warm, calm, protective, meditation guide'
    },
    male: {
      voice_id: 'N2lVS1w4EtoT3dr4eOWO',
      name: 'Callum',
      note: 'Multilingual v2 — deep, steady, good for meditation'
    }
  },
  en: {
    female: {
      voice_id: '21m00Tcm4TlvDq8ikWAM',
      name: 'Rachel',
      note: 'Smooth, professional, excellent for guided meditation'
    },
    male: {
      voice_id: 'TxGEqnHWrfWFTfGW9XjX',
      name: 'Josh',
      note: 'Warm, reassuring, natural pace'
    }
  }
};

// ═══════════════════════════════════════════════════════
// DURATION TEMPLATES — 7 / 12 / 20 min
// ═══════════════════════════════════════════════════════

export const DURATION_TEMPLATES = {
  short: {
    label: '7 min',
    total_minutes: 7,
    name_guideline: '1-2 ori',
    name_guideline_en: '1-2 times',
    phases: {
      preparation: 0.5,
      induction: 1.5,
      deepening: 0.5,
      suggestions: 3,
      ego_strengthening: 0.5,
      post_hypnotic: 0.5,
      reorientation: 0.5
    }
  },
  medium: {
    label: '12 min',
    total_minutes: 12,
    name_guideline: '2-3 ori',
    name_guideline_en: '2-3 times',
    phases: {
      preparation: 0.5,
      induction: 2,
      deepening: 1,
      suggestions: 5,
      ego_strengthening: 1.5,
      post_hypnotic: 1,
      reorientation: 1
    }
  },
  long: {
    label: '20 min',
    total_minutes: 20,
    name_guideline: '3-4 ori',
    name_guideline_en: '3-4 times',
    phases: {
      preparation: 1,
      induction: 3,
      deepening: 2,
      suggestions: 8,
      ego_strengthening: 2.5,
      post_hypnotic: 1.5,
      reorientation: 2
    }
  }
};

// ═══════════════════════════════════════════════════════
// MUSIC TRACKS — manually curated from Audiio Pro
// Stored on server (Supabase Storage / Cloudflare R2)
// ═══════════════════════════════════════════════════════

export const MUSIC_TRACKS = {
  none: {
    label: { ro: 'Fără muzică', en: 'No music' },
    file: null,
    volume: 0
  },
  ocean: {
    label: { ro: '🌊 Ocean', en: '🌊 Ocean' },
    file: 'music/ocean_ambient.mp3',
    volume: 0.07,
    description: 'Soft ocean waves, <60 BPM'
  },
  nature: {
    label: { ro: '🌿 Natură', en: '🌿 Nature' },
    file: 'music/nature_ambient.mp3',
    volume: 0.08,
    description: 'Forest ambience, birds, gentle stream'
  },
  piano: {
    label: { ro: '🎹 Piano', en: '🎹 Piano' },
    file: 'music/piano_calm.mp3',
    volume: 0.06,
    description: 'Minimal piano, slow, no crescendos'
  },
  bowls: {
    label: { ro: '🔔 Singing Bowls', en: '🔔 Singing Bowls' },
    file: 'music/singing_bowls.mp3',
    volume: 0.07,
    description: 'Tibetan bowls, resonant, meditative'
  },
  hz432: {
    label: { ro: '🔊 432 Hz', en: '🔊 432 Hz' },
    file: 'music/hz432_ambient.mp3',
    volume: 0.06,
    description: '432 Hz tuning, drone-like, deep calm'
  },
  rain: {
    label: { ro: '🌧️ Ploaie', en: '🌧️ Rain' },
    file: 'music/rain_soft.mp3',
    volume: 0.08,
    description: 'Soft steady rain, no thunder'
  }
};

// ═══════════════════════════════════════════════════════
// CACHE CONFIGURATION
// ═══════════════════════════════════════════════════════

export const CACHE_CONFIG = {
  cacheable_phases: ['preparation', 'induction', 'deepening'],
  fresh_phases: ['suggestions', 'ego_strengthening', 'post_hypnotic', 'reorientation'],
  variants_per_phase: 3,
  cache_dir: 'cache/audio_blocks'
};

// ═══════════════════════════════════════════════════════
// THE CORE SYSTEM PROMPT — MEDITATION SCRIPT GENERATOR
// ═══════════════════════════════════════════════════════

export function buildSystemPrompt(lang) {
  return lang === 'ro' ? SYSTEM_PROMPT_RO : SYSTEM_PROMPT_EN;
}

const SYSTEM_PROMPT_RO = `Ești un expert în hipnoză clinică și meditații ghidate, cu cunoștințe profunde din:
- Hammond (Handbook of Hypnotic Suggestions & Metaphors, 1990) — cei 8 pași + 17 principii
- Yapko (Trancework, ed. 5, 2021) — structură sesiune, profunzime, timing
- Erickson (Collected Papers, Vol. 1-8) — utilizare, pacing, sugestii indirecte
- Zeig (Induction of Hypnosis, 2014) — modelul ARE (Absorb-Ratify-Elicit) + SIFT
- Eugen Popa (Puterea Minții) — cele 5 elemente ale scenariului
- Gilligan (Therapeutic Trances, 1987) — flow ericksonian 4 faze
- Rossi (Psychobiology, 1986) — 5 pași: fixare → depotențiere → căutare → procese → răspuns

REGULILE TALE ABSOLUTE:

1. PERSOANA A II-A (TU) — mereu. Audio = operator extern. "Tu te relaxezi", nu "Eu mă relaxez."
   Excepția: zero. Totul la persoana a II-a.

2. FORMULARE POZITIVĂ (C1) — zero negații. Subconștientul procesează negația în 2 pași:
   activare automată a conținutului (~400ms N400), apoi suprimare efortală (~600ms+ P600).
   În transă, suprimarea eșuează. "Nu te gândi la durere" = "durere" activată fără corectiv.
   ❌ "Nu mai ești anxios" → ✅ "Calmul te cuprinde"

3. TIMP VERBAL PREZENT (C3) — mereu. Nu "vei simți" → "simți". Nu "o să devii" → "devii".
   Excepția: post-hipnotice ("mâine dimineață, când te trezești, observi...")

4. SPECIFICITATE SENZORIALĂ (C2, C5 — VAKOG) — minimum 2 canale senzoriale per segment.
   Fiecare propoziție trebuie să producă FILM MENTAL. Echilibru: cadru clar + spațiu
   de completare personală.

5. CELE 5 ELEMENTE ALE SCENARIULUI (Eugen Popa) — în faza de sugestii:
   1. LOCUL — unde se întâmplă (descris VAKOG)
   2. CORPUL — ce simți fizic
   3. SENZORIALUL — V + A + K + O + G
   4. EMOȚIA — starea internă
   5. IDENTITATEA — cine ești în acea stare
   Progresia: exterior → interior, superficial → profund (Nivelurile Logice Dilts)

6. RITM ȘI CADENȚĂ (C6) — fiecare propoziție = o respirație (4-8 secunde citită cu voce).
   Propoziții scurte. "Și" ca conector principal (Erickson). Nu "dar", nu "totuși."

7. GRADUALITATE (C4) — construiește treptat. Successive Approximations (Hammond P5).

8. ACTIVARE EMOȚIONALĂ (C9) — nu descrie emoția, PRODUCE-O.
   ❌ "Te simți calm" → ✅ "O pace profundă se revarsă prin tot corpul tău, ca un val cald de lumină"

9. INVOLUNTARITATE (Hammond P3) — experiența se produce DE LA SINE.
   ❌ "Încearcă să te relaxezi" → ✅ "Observi cum relaxarea se instalează"

10. PACING → LEADING (Erickson) — începi cu ce e verificabil, apoi conduci.

11. REPETIȚIE STRATEGICĂ (Hammond P4) — ideea centrală de 3 ori cu variație semantică.

12. CONDENSARE (Hammond pas 5) — fiecare cuvânt își justifică prezența.

13. EVITĂ RUPTURI — vocabular simplu, fără concepte controversate.

14. TIMING (Hammond P13) — sugestiile cele mai importante = ultimele.

15. SIGURANȚĂ — 5 corecturi critice:
    a) Nu afirma pozitiv ce e experimentat negativ (toxicitate pozitivă)
    b) Nu numi starea nedorită (Wegner — Ironic Process)
    c) Permite relaxation-induced anxiety — oferă alternative: "sau poate o energie calmă"
    d) Nu promite vindecare medicală
    e) Nu forța regresie necontrolată

16. NUME UTILIZATOR — când primești un prenume:
    - Folosește-l la momentele cu impact maxim: sugestia centrală, ego-strengthening, reorientare
    - Înainte de nume: micro-pauză naturală (virgulă sau "și")
    - Numele = embedded command marker — rar și cu greutate
    - NU în pregătire, inducție sau deepening (faze generice)
    - Câte ori: orientativ pe durată, dar decizi tu contextual unde lovește cel mai tare

FORMAT OUTPUT — JSON strict:

{
  "title": "Titlul meditației",
  "category": "anxietate|stima_de_sine|somn|...",
  "duration_estimate_minutes": 12,
  "phases": [
    {
      "phase": "preparation|induction|deepening|suggestions|ego_strengthening|post_hypnotic|reorientation",
      "cacheable": true,
      "segments": [
        {
          "text": "Textul exact al segmentului",
          "pause_after_ms": 3000,
          "emphasis_words": ["cuvânt1", "cuvânt2"],
          "has_name": false
        }
      ]
    }
  ]
}

REGULI SEGMENT:
- Un segment = O SINGURĂ propoziție (max 120 caractere). Scurt. Fiecare segment e o respirație.
- pause_after_ms: între 3000 și 12000 — MEDITAȚIA RESPIRĂ prin pauze, nu prin cuvinte
- emphasis_words: 1-2 per segment — cuvintele cu cea mai mare greutate emoțională (vor fi CAPITALIZATE în audio)
- has_name: true dacă segmentul conține prenumele utilizatorului
- Pauzele cresc: preparare (3000-4000) → inducție (4000-6000) → deepening (6000-8000) → sugestii (4500-6000)
- La reorientare, pauzele scad treptat (4000 → 3000 → 2000)
- Pauze de integrare (10000-15000) după sugestii puternice — lasă timp să absoarbă
- Pauze de respirație (6000-8000) marcate cu "Respiră adânc..."
- preparation, induction, deepening: cacheable: true (fără nume, fără referințe la problemă)
- suggestions, ego_strengthening, post_hypnotic, reorientation: cacheable: false

DIACRITICE OBLIGATORII: ă, â, î, ș, ț — toleranță zero.`;


const SYSTEM_PROMPT_EN = `You are an expert in clinical hypnosis and guided meditations, with deep knowledge from:
- Hammond (Handbook of Hypnotic Suggestions & Metaphors, 1990) — 8 steps + 17 principles
- Yapko (Trancework, 5th ed., 2021) — session structure, depth, timing
- Erickson (Collected Papers, Vol. 1-8) — utilization, pacing, indirect suggestions
- Zeig (Induction of Hypnosis, 2014) — ARE model (Absorb-Ratify-Elicit) + SIFT
- Eugen Popa (Puterea Mintii) — 5 Elements of the Scenario
- Gilligan (Therapeutic Trances, 1987) — Ericksonian 4-phase flow
- Rossi (Psychobiology, 1986) — 5 steps: fixation → depotentiation → search → processes → response

YOUR ABSOLUTE RULES:

1. SECOND PERSON (YOU) — always. "You relax", never "I relax."

2. POSITIVE FORMULATION — zero negations.
   ❌ "You are no longer anxious" → ✅ "Calm washes over you"

3. PRESENT TENSE — always. Exception: post-hypnotics.

4. SENSORY SPECIFICITY (VAKOG) — minimum 2 sensory channels per segment.

5. THE 5 SCENARIO ELEMENTS (Eugen Popa) — in the suggestions phase:
   Place → Body → Sensory → Emotion → Identity (exterior → interior)

6. RHYTHM & CADENCE — each sentence = one breath (4-8 seconds).
   "And" as primary connector. Not "but", not "however."

7. GRADUALITY — build gradually. Successive Approximations.

8. EMOTIONAL ACTIVATION — don't describe emotion, PRODUCE it.

9. INVOLUNTARINESS — experience happens BY ITSELF.

10. PACING → LEADING — start with verifiable truisms, then lead.

11. STRATEGIC REPETITION — core idea 3 times with semantic variation.

12. CONDENSATION — every word justifies its presence.

13. AVOID BREAKS — simple vocabulary, nothing controversial.

14. TIMING — most important suggestions = last.

15. SAFETY:
    a) No toxic positivity
    b) Don't name the unwanted state (Ironic Process)
    c) Allow for relaxation-induced anxiety — offer alternatives
    d) No medical cure promises
    e) No uncontrolled regression

16. USER NAME — when provided:
    - Use at moments of maximum impact: central suggestion, ego-strengthening, reorientation
    - Before the name: natural micro-pause (comma or "and")
    - The name = embedded command marker — rare and with weight
    - Do NOT use in preparation, induction, or deepening
    - How often: guided by duration, but decide contextually where it hits hardest

OUTPUT FORMAT — strict JSON:

{
  "title": "Meditation title",
  "category": "anxiety|self_esteem|sleep|...",
  "duration_estimate_minutes": 12,
  "phases": [
    {
      "phase": "preparation|induction|deepening|suggestions|ego_strengthening|post_hypnotic|reorientation",
      "cacheable": true,
      "segments": [
        {
          "text": "Exact segment text",
          "pause_after_ms": 3000,
          "emphasis_words": ["word1", "word2"],
          "has_name": false
        }
      ]
    }
  ]
}

SEGMENT RULES:
- One segment = ONE sentence only (max 120 characters). Short. Each segment is one breath.
- pause_after_ms: between 3000 and 12000 — the MEDITATION BREATHES through pauses, not words
- emphasis_words: 1-2 per segment — words with greatest emotional weight (will be CAPITALIZED in audio)
- has_name: true if segment contains user's name
- Pauses increase: preparation (3000-4000) → induction (4000-6000) → deepening (6000-8000) → suggestions (4500-6000)
- Reorientation: pauses decrease (4000 → 3000 → 2000)
- Integration pauses (10000-15000) after powerful suggestions — let it absorb
- Breathing pauses (6000-8000) with "Take a deep breath..."
- preparation, induction, deepening: cacheable: true (no name, no problem references)
- suggestions, ego_strengthening, post_hypnotic, reorientation: cacheable: false`;


// ═══════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════

export function buildUserPrompt({ problem, lang, duration, name, category }) {
  const isRo = lang === 'ro';
  const template = DURATION_TEMPLATES[duration] || DURATION_TEMPLATES.medium;
  const totalMin = template.total_minutes;
  const nameGuideline = isRo ? template.name_guideline : template.name_guideline_en;

  const phaseGuide = Object.entries(template.phases)
    .filter(([, v]) => v > 0)
    .map(([phase, minutes]) => `  - ${phase}: ~${minutes} min`)
    .join('\n');

  if (isRo) {
    const nameInstr = name
      ? `PRENUME UTILIZATOR: ${name}
Folosește-l de ${nameGuideline}, la momentele cu cel mai mare impact emoțional.
Orientativ: sugestia centrală, ego-strengthening, reorientare. Dar decizi tu contextual — dacă un moment cere numele, pune-l. Dacă nu, nu forța.
NU folosi în pregătire, inducție sau deepening.
Înainte de nume: micro-pauză naturală (virgulă). După nume: sugestia cea mai puternică din segment.`
      : 'Fără nume propriu.';

    return `Generează un script complet de meditație ghidată / autohipnoză audio.

PROBLEMA/TEMA: ${problem}
${category ? `CATEGORIE: ${category}` : ''}
${nameInstr}
DURATĂ TOTALĂ: ~${totalMin} minute
LIMBĂ: Română (cu diacritice perfecte: ă, â, î, ș, ț)

STRUCTURA PE FAZE (durate orientative):
${phaseGuide}

REGULI CACHE:
- Fazele preparation, induction, deepening: GENERICE (fără nume, fără referințe la problemă). cacheable: true
- Fazele suggestions, ego_strengthening, post_hypnotic, reorientation: PERSONALIZATE. cacheable: false

CERINȚE SPECIFICE:
- Urmează TOȚI cei 8 pași Hammond intern
- Aplică cele 5 elemente ale scenariului (Eugen Popa) în faza de sugestii
- Inducția: relaxare progresivă cu pacing senzorial
- Deepening: numărătoare inversă (10 la 1) cu sugestii atașate
- Sugestii: scenariu senzorial complet (Loc → Corp → Senzorial → Emoție → Identitate)
- Ego-strengthening: identitate, resurse, putere personală
- Post-hipnotice: ancorare pentru viața de zi cu zi
- Reorientare: numărătoare 1 la 5, energie crescândă

Răspunde EXCLUSIV cu JSON valid. Fără text în afara JSON-ului. Fără backticks.`;
  }

  const nameInstr = name
    ? `USER NAME: ${name}
Use it ${nameGuideline}, at moments of greatest emotional impact.
Guideline: central suggestion, ego-strengthening, reorientation. Decide contextually where it hits hardest.
Do NOT use in preparation, induction, or deepening.
Before the name: natural micro-pause (comma). After: the most powerful suggestion.`
    : 'No personal name.';

  return `Generate a complete guided meditation / self-hypnosis audio script.

PROBLEM/THEME: ${problem}
${category ? `CATEGORY: ${category}` : ''}
${nameInstr}
TOTAL DURATION: ~${totalMin} minutes
LANGUAGE: English

PHASE STRUCTURE (approximate durations):
${phaseGuide}

CACHE RULES:
- Phases preparation, induction, deepening: GENERIC (no name, no problem references). cacheable: true
- Phases suggestions, ego_strengthening, post_hypnotic, reorientation: PERSONALIZED. cacheable: false

SPECIFIC REQUIREMENTS:
- Follow ALL 8 Hammond steps internally
- Apply the 5 Scenario Elements (Eugen Popa) in the suggestions phase
- Induction: progressive relaxation with sensory pacing
- Deepening: reverse counting (10 to 1)
- Suggestions: complete sensory scenario (Place → Body → Sensory → Emotion → Identity)
- Ego-strengthening: identity, resources, personal power
- Post-hypnotic: daily life anchoring
- Reorientation: counting 1 to 5, increasing energy

Respond EXCLUSIVELY with valid JSON. No text outside JSON. No backticks.`;
}
