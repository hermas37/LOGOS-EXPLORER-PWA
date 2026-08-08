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
          "flashcards":    "episodes/new-heaven-and-new-earth/ep01_flashcards_en.json",
          "digDeeper": [
            {
              "title": "Master script",
              "description": "",
              "url": "episodes/new-heaven-and-new-earth/ep01_master_script_en.md"
            },
            {
              "title": "Report briefing",
              "description": "",
              "url": "episodes/new-heaven-and-new-earth/ep01_report_briefing_en.md"
            }
          ]
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

## Asset roles — exactly five, plus the devotional

| Key | Lane | Extensions | Shape | Notes |
|---|---|---|---|---|
| `audioOverview` | heavy → Blob | `.m4a` `.mp3` `.wav` | `string` | **Required.** A language without audio is not offered. |
| `slideDeck` | heavy → Blob | `.pdf` | `string` | |
| `infographic` | heavy → Blob | `.webp` `.png` `.jpg` `.jpeg` | `string` | |
| `flashcards` | light → repo | `.json` `.csv` | `string` | `[{ front, back, note }]` |
| `digDeeper` | light → repo | `.md` `.txt` | `{ title, description, url }[]` | **The one multi-file role.** Publishing more files appends; it never overwrites. |
| `devotional` | inline | — | object | Hand-written, per language, native Bible translation |

Every role except `digDeeper` holds exactly one file per language — a second file staged for the same role and language is a conflict, not an update.

Detection at staging time is by file extension alone. No filename keyword ever decides a role.

`mindmap`, `masterScript`, `report`, `quiz`, and `videoOverview` are all gone. The old `heavyMedia` and `studySelector` keys are gone too.

---

## Dig Deeper front-matter

A Dig Deeper markdown file may open with a YAML front-matter block, delimited by `---` at the very start of the file:

```markdown
---
title: The Mud Pie Paradox
description: C.S. Lewis on desire, Sehnsucht, and the New Earth.
---

The rest of the document...
```

- When the block is present, `title` and `description` populate the manifest entry.
- When it is absent, the title is derived from the filename — strip an `epNN_` prefix and a trailing `_lang` suffix and the extension, turn dashes/underscores into spaces, capitalise the first letter — and the description is left empty.
- The block is stripped before the document is rendered; it never appears in the study view.

---

## Resolution rule

Given an episode, an asset key, and a chosen language:

```
1. languages[lang].assets[key]        → use it, mark as "in this language"
2. languages[defaultLanguage].assets[key]  → use it, mark as "English"
3. neither exists                     → render nothing at all
```

For `digDeeper`, "exists" means the array is non-empty — an empty array is treated the same as a missing key, and falls through to step 2.

Step 3 is important: **no disabled buttons, no "coming soon", no greyed rows.** A reader cannot tell whether an asset was never planned or is merely absent.

---

## The study view

Rows are assets — `Audio Overview`, `Slide Deck`, `Infographic`, `Flashcards`, `Dig Deeper`, `Devotional` — filtered to the ones that exist for this episode in any language.

Each row shows:

- A **default-language button**, always present, labelled with the episode's default language (e.g. "English").
- An **"Available Language" control**, present only when at least one *other* language actually has that specific asset. It opens a dropdown listing just those languages. A row where only the default language has the asset shows no dropdown at all.

Tapping either is explicit each time — **no sticky language**, and no `(EN)` markers on the controls themselves. When a tap resolves to a fallback asset, a banner below the row says so ("Not yet available in Bahasa Indonesia — showing English").

The `digDeeper` row's controls pick a *language*, same as every other row. Once a language resolves, if that language has more than one Dig Deeper document, a second-level dropdown lists them — title on the first line, description beneath. Tapping an entry renders it in the markdown viewer with a close control that returns to that list.

The devotional row is visually distinct (cream, hand-written) from the generated assets above it.

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

## Migration notes

v2 carried seven asset roles: `audioOverview`, `slideDeck`, `infographic`, `mindmap`, `masterScript`, `report`, `flashcards`. v3 collapses `mindmap`, `masterScript`, and `report` into the single `digDeeper` array — each surviving `.md` file becomes one entry, title derived from its filename since none of them carried front-matter.

The original v1 migration note stands for historical context: the very first manifest carried `heavyMedia`, `studySelector`, `quizData`, and hardcoded `vercel-blob.com` URLs that were never real, and none of it mapped forward either.

`src/data/script.ts` and `src/data/slides.ts`, if they still exist, are dead — the renderers read from the manifest.
