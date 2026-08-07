# Logos Explorer — manifest v3

The shape the study view and admin console both read. Two ideas carry it:

1. **Languages are data, not code.** Adding Portuguese means adding a key, never editing TypeScript.
2. **Fallback is per asset, not per episode.** Indonesian audio + English flashcards is a normal, valid state — not a broken one.

---

## File layout

```
logos-explorer-manifest.json     ← the array of episodes
vocabulary/en.json               ← series-wide lexicon, one per language
vocabulary/id.json
episodes/<slug>/                 ← light assets, committed by publish
```

---

## Episode shape

```json
[
  {
    "episodeId": "ep-01",
    "sequence": 1,
    "slug": "new-heaven-and-new-earth",
    "title": "New Heaven and New Earth",
    "subtitle": "Why the world to come will feel like coming home",
    "youtubeUrl": null,
    "published": true,
    "defaultLanguage": "en",

    "languages": {
      "en": {
        "assets": {
          "audioOverview": "https://4gis32c7ro9bt3b7.public.blob.vercel-storage.com/episodes/new-heaven-and-new-earth/ep01_audio_overview_en.m4a",
          "slideDeck":     "https://4gis32c7ro9bt3b7.public.blob.vercel-storage.com/episodes/new-heaven-and-new-earth/ep01_slides_en.pdf",
          "infographic":   "https://4gis32c7ro9bt3b7.public.blob.vercel-storage.com/episodes/new-heaven-and-new-earth/ep01_infographic_en.webp",
          "mindmap":       "episodes/new-heaven-and-new-earth/ep01_mindmap_en.md",
          "masterScript":  "episodes/new-heaven-and-new-earth/ep01_master_script_en.md",
          "report":        "episodes/new-heaven-and-new-earth/ep01_report_briefing_en.md",
          "flashcards":    "episodes/new-heaven-and-new-earth/ep01_flashcards_en.json"
        },
        "devotional": {
          "quote": "",
          "quoteSource": "",
          "verse": "",
          "verseRef": "",
          "reflection": ""
        }
      },

      "id": {
        "assets": {
          "audioOverview": "https://4gis32c7ro9bt3b7.public.blob.vercel-storage.com/episodes/new-heaven-and-new-earth/ep01_audio_overview_id.m4a"
        },
        "devotional": null
      }
    }
  }
]
```

Indonesian here has one asset. That is a complete, valid entry — everything else falls back to English.

---

## Language registry

Top of the same file, or a sibling `languages.json`. Nothing about a language is hardcoded.

```json
{
  "en": { "label": "Simplified English", "nativeLabel": "Simplified English", "bible": "ESV" },
  "id": { "label": "Indonesian",         "nativeLabel": "Bahasa Indonesia",   "bible": "TB" },
  "es": { "label": "Spanish",            "nativeLabel": "Español",            "bible": "RVR1960" }
}
```

Adding a fourth language is one object. No code change.

---

## Asset roles — exactly seven, plus the devotional

| Key | Lane | Extension | Notes |
|---|---|---|---|
| `audioOverview` | heavy → Blob | `.m4a` | **Required.** A language without audio is not offered. |
| `slideDeck` | heavy → Blob | `.pdf` | |
| `infographic` | heavy → Blob | `.webp` | |
| `mindmap` | light → repo | `.md` | Tabbed text, not an image |
| `masterScript` | light → repo | `.md` | Same document as the story source |
| `report` | light → repo | `.md` | Briefing doc |
| `flashcards` | light → repo | `.json` | `[{ front, back, note }]` |
| `devotional` | inline | — | Hand-written, per language, native Bible translation |

`quiz` and `videoOverview` are gone. The old `heavyMedia` and `studySelector` keys are gone.

---

## Resolution rule

Given an episode, an asset key, and a chosen language:

```
1. languages[lang].assets[key]        → use it, mark as "in this language"
2. languages[defaultLanguage].assets[key]  → use it, mark as "English"
3. neither exists                     → render nothing at all
```

Step 3 is important: **no disabled buttons, no "coming soon", no greyed rows.** A reader cannot tell whether an asset was never planned or is merely absent.

---

## The availability table

The study view's centrepiece. Rows are assets; columns are languages that exist for this episode. A filled cell is tappable and opens that asset in that language.

```
                    English    Bahasa Indonesia
Audio Overview         ●              ●
Slide Deck             ●
Infographic            ●
Mindmap                ●
Master Script          ●
Report                 ●
Flashcards             ●
Devotional             ●
```

Rules:

- Only languages with `audioOverview` present get a column.
- Empty cells stay blank. No dash, no marker.
- Tapping is explicit each time — **no sticky language**. English is always the floor.
- The devotional row is visually distinct (cream, hand-written) from the generated assets above it.
- On mobile the table stacks: asset name, then a short row of tappable language chips beneath.

---

## Vocabulary — series-wide, not per episode

Not an episode asset. One screen, always reachable, grows as episodes accumulate.

```json
[
  {
    "term": "prinsip-prinsip ilahi (logoi)",
    "original": "λόγοι / logoi",
    "definition": "Kehendak Allah yang menetapkan hakikat setiap ciptaan.",
    "source": "Maximus, Ambigua 7",
    "firstSeen": "ep-01",
    "verified": false
  }
]
```

`verified: false` until a reader of that language has checked it. Nothing claims to be checked that hasn't been.

The bracket convention — common rendering with the original in brackets on first use — lives in the `term` field, so it is fixed in the data rather than left to each renderer.

---

## Migration from v1

The current manifest carries `heavyMedia`, `studySelector`, `quizData`, and hardcoded `vercel-blob.com` URLs that were never real. None of it maps. The one real entry — Episode 01, published today — has genuine Blob URLs and should be reshaped by hand into the structure above.

Everything else in the old manifest is discardable.

`src/data/script.ts` and `src/data/slides.ts` should be deleted once the renderers read from the manifest. They are the reason Episode 01 currently shows Mountain and the Road content.
