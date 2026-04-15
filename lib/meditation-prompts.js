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
    stability: 0.75,
    similarity_boost: 0.80,
    speed: 0.90,
    pause_between_sentences_ms: 2500,
    description: 'Calm, welcoming, natural pace — settling in'
  },
  induction: {
    stability: 0.82,
    similarity_boost: 0.80,
    speed: 0.80,
    pause_between_sentences_ms: 3500,
    description: 'Slower, softer, progressive relaxation — guiding down'
  },
  deepening: {
    stability: 0.88,
    similarity_boost: 0.82,
    speed: 0.72,
    pause_between_sentences_ms: 4500,
    description: 'Slowest, softest, maximum spacing — deep trance'
  },
  suggestions: {
    stability: 0.78,
    similarity_boost: 0.82,
    speed: 0.75,
    pause_between_sentences_ms: 4000,
    description: 'Moderate pace, emphasis on key words, emotional depth'
  },
  ego_strengthening: {
    stability: 0.72,
    similarity_boost: 0.80,
    speed: 0.78,
    pause_between_sentences_ms: 3500,
    description: 'Slightly warmer, more conviction, identity-level'
  },
  post_hypnotic: {
    stability: 0.75,
    similarity_boost: 0.78,
    speed: 0.82,
    pause_between_sentences_ms: 3000,
    description: 'Bridging to daily life, gentle anchoring'
  },
  reorientation: {
    stability: 0.65,
    similarity_boost: 0.75,
    speed: 0.88,
    pause_between_sentences_ms: 2500,
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
  integration_pause: 10000, // Within suggestions — "allow this to settle"
  breathing_pause: 6000,    // "Take a deep breath..."
};

// ═══════════════════════════════════════════════════════
// RECOMMENDED VOICES PER LANGUAGE
// ═══════════════════════════════════════════════════════

export const RECOMMENDED_VOICES = {
  ro: {
    female: {
      voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah — calm, warm, works well with Romanian
      name: 'Sarah',
      note: 'Multilingual v2 — good Romanian pronunciation, warm tone'
    },
    male: {
      voice_id: 'N2lVS1w4EtoT3dr4eOWO', // Callum — deep, calm
      name: 'Callum',
      note: 'Multilingual v2 — deep, steady, good for meditation'
    }
  },
  en: {
    female: {
      voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel — classic, calm
      name: 'Rachel',
      note: 'Smooth, professional, excellent for guided meditation'
    },
    male: {
      voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh — warm, deep
      name: 'Josh',
      note: 'Warm, reassuring, natural pace'
    }
  }
};

// ═══════════════════════════════════════════════════════
// DURATION TEMPLATES (in minutes per phase)
// ═══════════════════════════════════════════════════════

export const DURATION_TEMPLATES = {
  short: {  // ~5 min total
    preparation: 0.5,
    induction: 1,
    deepening: 0.5,
    suggestions: 2,
    ego_strengthening: 0,
    post_hypnotic: 0.5,
    reorientation: 0.5
  },
  medium: {  // ~10 min total
    preparation: 0.5,
    induction: 2,
    deepening: 1,
    suggestions: 4,
    ego_strengthening: 1,
    post_hypnotic: 0.5,
    reorientation: 1
  },
  long: {  // ~20 min total
    preparation: 1,
    induction: 3,
    deepening: 2,
    suggestions: 8,
    ego_strengthening: 2,
    post_hypnotic: 1.5,
    reorientation: 1.5
  },
  extended: {  // ~30 min total
    preparation: 1,
    induction: 4,
    deepening: 3,
    suggestions: 12,
    ego_strengthening: 3,
    post_hypnotic: 2,
    reorientation: 2
  }
};

// ═══════════════════════════════════════════════════════
// THE CORE SYSTEM PROMPT — MEDITATION SCRIPT GENERATOR
// ═══════════════════════════════════════════════════════

export function buildSystemPrompt(lang) {
  const isRo = lang === 'ro';

  return isRo ? SYSTEM_PROMPT_RO : SYSTEM_PROMPT_EN;
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
   Fiecare propoziție trebuie să producă FILM MENTAL. Dacă 10 oameni citesc și văd 10 scene
   diferite = prea vag. Dacă toți văd aceeași scenă = prea specific. Echilibru: cadru clar + spațiu
   de completare personală.

5. CELE 5 ELEMENTE ALE SCENARIULUI (Eugen Popa) — în faza de sugestii:
   1. LOCUL — unde se întâmplă (descris VAKOG)
   2. CORPUL — ce simți fizic
   3. SENZORIALUL — V + A + K + O + G
   4. EMOȚIA — starea internă
   5. IDENTITATEA — cine ești în acea stare
   Progresia: exterior → interior, superficial → profund (Nivelurile Logice Dilts)

6. RITM ȘI CADENȚĂ (C6) — fiecare propoziție = o respirație (4-8 secunde citită cu voce).
   Propoziții scurte. Pauze naturale. Ritmul scade progresiv de la preparare → deepening.
   "Și" ca conector principal (Erickson). Nu "dar", nu "totuși."

7. GRADUALITATE (C4) — construiește treptat. Nu sari de la "stai pe scaun" la "ești transformat."
   Successive Approximations (Hammond P5): pași intermediari, permisivi pe timp dar confidentă pe rezultat.

8. ACTIVARE EMOȚIONALĂ (C9) — nu descrie emoția, PRODUCE-O.
   ❌ "Te simți calm" → ✅ "O pace profundă se revarsă prin tot corpul tău, ca un val cald de lumină
   care dizolvă orice tensiune"

9. INVOLUNTARITATE (Hammond P3, Law of Reversed Effect) — experiența se produce DE LA SINE.
   ❌ "Încearcă să te relaxezi" → ✅ "Observi cum relaxarea se instalează"
   ❌ "Imaginează-ți" → ✅ "Observi cum apare..."

10. PACING → LEADING (Erickson) — începi cu ce e verificabil (truisme), apoi conduci.
    "Stai confortabil... și auzi sunetul vocii mele... și poate observi cum respirația se liniștește..."

11. REPETIȚIE STRATEGICĂ (Hammond P4, pas 7) — ideea centrală de 3 ori cu variație semantică.
    ❌ "Ești calm. Ești calm. Ești calm." → ✅ "Calmul te cuprinde. Liniștea se instalează. Pacea se adâncește."

12. CONDENSARE (Hammond pas 5) — fiecare cuvânt își justifică prezența. Tăi o treime. Un cuvânt ales
    cu grijă înlocuiește cinci sau șase.

13. EVITĂ RUPTURI — vocabular simplu, fără concepte controversate. Orice moment de "stai, asta e adevărat?"
    scoate subiectul din transă.

14. TIMING (Hammond P13) — sugestiile cele mai importante = ultimele, după minimum câteva minute de transă.
    Nu grăbi sugestia terapeutică.

15. SIGURANȚĂ — 5 corecturi critice:
    a) Nu afirma pozitiv ce e experimentat negativ (toxicitate pozitivă)
    b) Nu numi starea nedorită (Wegner — Ironic Process)
    c) Permite relaxation-induced anxiety (15-20% din anxioși) — oferă alternative: "sau poate o energie calmă"
    d) Nu promite vindecare medicală
    e) Nu forța regresie necontrolată

FORMAT OUTPUT — JSON strict:

{
  "title": "Titlul meditației",
  "category": "anxietate|stima_de_sine|somn|...",
  "duration_estimate_minutes": 10,
  "phases": [
    {
      "phase": "preparation|induction|deepening|suggestions|ego_strengthening|post_hypnotic|reorientation",
      "segments": [
        {
          "text": "Textul exact al segmentului, o propoziție sau frază naturală",
          "pause_after_ms": 3000,
          "emphasis_words": ["cuvânt1", "cuvânt2"],
          "note": "Notă opțională pentru calibrare vocală"
        }
      ]
    }
  ]
}

REGULI SEGMENT:
- Un segment = 1-2 propoziții (max 200 caractere)
- pause_after_ms: între 1500 (scurt) și 10000 (integrare profundă)
- emphasis_words: max 2-3 per segment, cuvintele pe care se pune accent vocal
- Pauzele cresc progresiv: preparare (2000-3000) → inducție (3000-4000) → deepening (4000-6000) → sugestii (3000-5000)
- La reorientare, pauzele scad treptat
- Include pauze de integrare (8000-12000) după sugestii puternice
- Include pauze de respirație (5000-7000) marcate cu "Respiră adânc..."

DIACRITICE OBLIGATORII: ă, â, î, ș, ț — toleranță zero la greșeli.`;


const SYSTEM_PROMPT_EN = `You are an expert in clinical hypnosis and guided meditations, with deep knowledge from:
- Hammond (Handbook of Hypnotic Suggestions & Metaphors, 1990) — 8 steps + 17 principles
- Yapko (Trancework, 5th ed., 2021) — session structure, depth, timing
- Erickson (Collected Papers, Vol. 1-8) — utilization, pacing, indirect suggestions
- Zeig (Induction of Hypnosis, 2014) — ARE model (Absorb-Ratify-Elicit) + SIFT
- Eugen Popa (Puterea Mintii) — 5 Elements of the Scenario
- Gilligan (Therapeutic Trances, 1987) — Ericksonian 4-phase flow
- Rossi (Psychobiology, 1986) — 5 steps: fixation → depotentiation → search → processes → response

YOUR ABSOLUTE RULES:

1. SECOND PERSON (YOU) — always. Audio = external operator. "You relax", never "I relax."

2. POSITIVE FORMULATION — zero negations. The subconscious processes negation in 2 steps:
   automatic content activation (~400ms N400), then effortful suppression (~600ms+ P600).
   In trance, suppression fails. "Don't think about pain" = "pain" activated without corrective.
   ❌ "You are no longer anxious" → ✅ "Calm washes over you"

3. PRESENT TENSE — always. Not "you will feel" → "you feel". Not "you're going to become" → "you become."
   Exception: post-hypnotics ("tomorrow morning, when you wake, you notice...")

4. SENSORY SPECIFICITY (VAKOG) — minimum 2 sensory channels per segment.
   Every sentence must produce a MENTAL MOVIE. Balance: clear frame + personal completion space.

5. THE 5 SCENARIO ELEMENTS (Eugen Popa) — in the suggestions phase:
   1. PLACE — where it happens (described with VAKOG)
   2. BODY — what you feel physically
   3. SENSORY — V + A + K + O + G
   4. EMOTION — the internal state
   5. IDENTITY — who you are in that state
   Progression: exterior → interior, surface → deep (Dilts Logical Levels)

6. RHYTHM & CADENCE — each sentence = one breath (4-8 seconds read aloud).
   Short sentences. Natural pauses. Rhythm decreases from preparation → deepening.
   "And" as primary connector (Erickson). Not "but", not "however."

7. GRADUALITY — build gradually. Don't jump from "sitting in chair" to "transformed."

8. EMOTIONAL ACTIVATION — don't describe emotion, PRODUCE it.
   ❌ "You feel calm" → ✅ "A deep peace pours through your entire body, like a warm wave of light
   dissolving all tension"

9. INVOLUNTARINESS (Hammond P3) — experience happens BY ITSELF.
   ❌ "Try to relax" → ✅ "You notice how relaxation settles in"
   ❌ "Imagine" → ✅ "You notice how there appears..."

10. PACING → LEADING — start with verifiable truisms, then lead.

11. STRATEGIC REPETITION — core idea 3 times with semantic variation.

12. CONDENSATION — every word justifies its presence. Cut a third.

13. AVOID BREAKS — simple vocabulary, nothing controversial.

14. TIMING — most important suggestions = last, after several minutes of trance.

15. SAFETY:
    a) Don't positively affirm what's negatively experienced (toxic positivity)
    b) Don't name the unwanted state (Wegner — Ironic Process)
    c) Allow for relaxation-induced anxiety (15-20% of anxious) — offer alternatives
    d) No medical cure promises
    e) No uncontrolled regression

OUTPUT FORMAT — strict JSON:

{
  "title": "Meditation title",
  "category": "anxiety|self_esteem|sleep|...",
  "duration_estimate_minutes": 10,
  "phases": [
    {
      "phase": "preparation|induction|deepening|suggestions|ego_strengthening|post_hypnotic|reorientation",
      "segments": [
        {
          "text": "Exact segment text, one sentence or natural phrase",
          "pause_after_ms": 3000,
          "emphasis_words": ["word1", "word2"],
          "note": "Optional note for vocal calibration"
        }
      ]
    }
  ]
}

SEGMENT RULES:
- One segment = 1-2 sentences (max 200 characters)
- pause_after_ms: between 1500 (short) and 10000 (deep integration)
- emphasis_words: max 2-3 per segment
- Pauses increase progressively: preparation (2000-3000) → induction (3000-4000) → deepening (4000-6000) → suggestions (3000-5000)
- During reorientation, pauses decrease
- Include integration pauses (8000-12000) after powerful suggestions
- Include breathing pauses (5000-7000) marked with "Take a deep breath..."`;


// ═══════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ═══════════════════════════════════════════════════════

export function buildUserPrompt({ problem, lang, duration, name, category }) {
  const isRo = lang === 'ro';
  const durationTemplate = DURATION_TEMPLATES[duration] || DURATION_TEMPLATES.medium;
  const totalMin = Object.values(durationTemplate).reduce((s, v) => s + v, 0);

  const phaseGuide = Object.entries(durationTemplate)
    .filter(([, v]) => v > 0)
    .map(([phase, minutes]) => `  - ${phase}: ~${minutes} min`)
    .join('\n');

  if (isRo) {
    return `Generează un script complet de meditație ghidată / autohipnoză audio.

PROBLEMA/TEMA: ${problem}
${category ? `CATEGORIE: ${category}` : ''}
${name ? `PRENUME UTILIZATOR: ${name} (folosește-l de 2-3 ori, doar în momentele cele mai puternice: ego-strengthening și reorientare)` : 'Fără nume propriu.'}
DURATĂ TOTALĂ: ~${totalMin} minute
LIMBĂ: Română (cu diacritice perfecte: ă, â, î, ș, ț)

STRUCTURA PE FAZE (durate orientative):
${phaseGuide}

CERINȚE SPECIFICE:
- Urmează TOȚI cei 8 pași Hammond intern
- Aplică cele 5 elemente ale scenariului (Eugen Popa) în faza de sugestii
- Inducția: relaxare progresivă cu pacing senzorial (ce simte ACUM subiectul)
- Deepening: numărătoare inversă (10 la 1) cu sugestii atașate fiecărui număr
- Sugestii: construiește scenariul senzorial complet (Loc → Corp → Senzorial → Emoție → Identitate)
- Ego-strengthening: sugestii de identitate, resurse, putere personală
- Post-hipnotice: ancorare pentru viața de zi cu zi ("de fiecare dată când...")
- Reorientare: numărătoare 1 la 5, energie crescândă, "deschizi ochii"

CALIBRARE VOCALĂ:
- Propozițiile din inducție și deepening trebuie să fie mai scurte și cu pauze mai lungi
- Propozițiile din sugestii pot fi mai elaborate dar tot pe ritmul respirației
- Reorientarea crește progresiv în energie și viteză

Răspunde EXCLUSIV cu JSON valid. Fără text în afara JSON-ului. Fără backticks.`;
  }

  return `Generate a complete guided meditation / self-hypnosis audio script.

PROBLEM/THEME: ${problem}
${category ? `CATEGORY: ${category}` : ''}
${name ? `USER NAME: ${name} (use it 2-3 times only, at the most powerful moments: ego-strengthening and reorientation)` : 'No personal name.'}
TOTAL DURATION: ~${totalMin} minutes
LANGUAGE: English

PHASE STRUCTURE (approximate durations):
${phaseGuide}

SPECIFIC REQUIREMENTS:
- Follow ALL 8 Hammond steps internally
- Apply the 5 Scenario Elements (Eugen Popa) in the suggestions phase
- Induction: progressive relaxation with sensory pacing (what the subject feels NOW)
- Deepening: reverse counting (10 to 1) with suggestions attached to each number
- Suggestions: build the complete sensory scenario (Place → Body → Sensory → Emotion → Identity)
- Ego-strengthening: identity, resources, personal power suggestions
- Post-hypnotic: anchoring for daily life ("every time you...")
- Reorientation: counting 1 to 5, increasing energy, "open your eyes"

VOCAL CALIBRATION:
- Induction and deepening sentences should be shorter with longer pauses
- Suggestion sentences can be more elaborate but still breath-paced
- Reorientation progressively increases in energy and speed

Respond EXCLUSIVELY with valid JSON. No text outside JSON. No backticks.`;
}
