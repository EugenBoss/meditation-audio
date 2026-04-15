# 🧘 Generator Meditații Audio — Puterea Minții

Sistem complet automatizat de generare meditații audio ghidate, cu pauze calibrate, prosodie naturală și ambient sonor.

## Pipeline

```
Temă/Problemă → Claude AI (script structurat) → ElevenLabs (sinteză vocală per segment)
→ FFmpeg (concatenare + ambient + normalizare) → MP3 final
```

## Funcționalități

- **2 limbi:** Română + Engleză (extensibil)
- **4 durate:** 5 min / 10 min / 20 min / 30 min
- **Voce feminină/masculină** — voci ElevenLabs optimizate pt. meditație
- **Ambient sonor:** ocean, natură, ploaie (generat cu FFmpeg)
- **Pauze calibrate** per fază: preparare → inducție → deepening → sugestii → reorientare
- **Prosodie** adaptată: stabilitate vocală, viteză, similaritate per fază
- **Normalizare LUFS -16** (standard podcast/meditație)
- **Fade in/out** automatic
- **Previzualizare script** înainte de generare audio
- **Structura meditației** respectă: Hammond (8 pași), Eugen Popa (5 Elemente), Erickson, Yapko, Zeig

## Instalare locală (Mac)

1. Instalează [Node.js 20+](https://nodejs.org)
2. Instalează FFmpeg: `brew install ffmpeg`
3. Clonează repo-ul
4. Copiază `.env.example` → `.env` și completează cheile API
5. `npm install`
6. `npm start`
7. Deschide `http://localhost:3000`

## Deploy pe Railway (recomandat)

Railway e cel mai simplu — deploy automat din GitHub, suportă Docker.

### Pași:

1. **Creează repo GitHub:** `meditation-audio` (sau orice nume)
2. **Încarcă toate fișierele** din acest proiect pe GitHub (drag & drop)
3. **Mergi pe [railway.app](https://railway.app)** → Sign in cu GitHub
4. **New Project → Deploy from GitHub repo** → selectează repo-ul
5. Railway detectează automat Dockerfile-ul
6. **Adaugă variabile de mediu** în Railway Dashboard → Variables:
   - `ANTHROPIC_API_KEY` = cheia ta Anthropic
   - `ELEVENLABS_API_KEY` = cheia ta ElevenLabs
   - `PORT` = 3000
7. **Deploy** → Railway construiește și pornește aplicația
8. Railway îți dă un URL public (ex: `meditation-audio-xxx.up.railway.app`)

### Costuri Railway:
- Hobby Plan: $5/lună (include $5 usage credit)
- O meditație de 10 min consumă ~2-3 min CPU → ~$0.01

## Costuri per meditație

| Component | Cost per meditație 10 min |
|-----------|--------------------------|
| Claude API (script) | ~$0.02 |
| ElevenLabs (TTS ~10k chars) | ~$0.30 |
| Railway (compute) | ~$0.01 |
| **Total** | **~$0.33** |

La 6 limbi: ~$2/meditație. La 100 meditații: ~$200.

## Structura proiect

```
meditation-audio/
├── server.js                      # Express server + pipeline
├── lib/
│   ├── meditation-prompts.js      # Core knowledge (Hammond, Erickson, Popa)
│   ├── script-generator.js        # Claude API → script structurat
│   ├── tts-engine.js              # ElevenLabs → audio per segment
│   └── audio-assembler.js         # FFmpeg → concatenare + mixing
├── public/
│   └── index.html                 # Web UI
├── output/                        # Fișiere generate (temporar)
├── package.json
├── Dockerfile                     # Pentru Railway/Render
├── .env.example
└── README.md
```

## Voci recomandate ElevenLabs

| Limbă | Gen | Voce | ID | Note |
|-------|-----|------|----|------|
| RO | F | Sarah | EXAVITQu4vr4xnSDxMaL | Caldă, calmă, română bună |
| RO | M | Callum | N2lVS1w4EtoT3dr4eOWO | Profundă, stabilă |
| EN | F | Rachel | 21m00Tcm4TlvDq8ikWAM | Clasic, calmă |
| EN | M | Josh | TxGEqnHWrfWFTfGW9XjX | Caldă, naturală |

**Pentru vocea ta/Angelei:** ElevenLabs Professional Voice Cloning — 30 min audio curat → voce clonată care funcționează în orice limbă.

## API Endpoints

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/generate` | POST | Pornește generarea (async) |
| `/api/status/:jobId` | GET | Verifică progresul |
| `/api/download/:jobId` | GET | Descarcă MP3 final |
| `/api/preview-script` | POST | Generează doar scriptul (fără audio) |
| `/api/voices` | GET | Listează vocile disponibile |

## Extensii viitoare

- [ ] Voice cloning (vocea lui Eugen/Angela)
- [ ] Background music (nu doar ambient generat)
- [ ] Integrare cu platforma evaluator.putereamintii.ro
- [ ] Batch generation (toate cele 12 categorii × 2 limbi × 4 durate)
- [ ] Supabase storage pentru audio-uri generate
- [ ] Email delivery (Resend) — generează + trimite pe email
- [ ] Mai multe limbi (ES, FR, DE, PT — deja suportate de ElevenLabs)
