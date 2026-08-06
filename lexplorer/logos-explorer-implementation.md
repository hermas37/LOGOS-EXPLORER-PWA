# Logos Explorer — rebuild notes

Companion to the prototype. This is the part that has to exist on the server for the drop zone to actually work.

---

## 0. Do this before anything else

Three secrets are compromised and must be reissued:

| Secret | Where to revoke |
|---|---|
| GitHub PAT `ghp_TSma…` | github.com → Settings → Developer settings → Tokens → Revoke |
| Vercel Blob RW token `vercel_blob_rw_StPm…` | Vercel → Storage → your Blob store → Tokens → Rotate |
| LogosAtlas API key `AQ.Ab8R…` | Google AI Studio → API keys → Delete |

When you reissue the GitHub token, use a **fine-grained** PAT scoped to `hermas37/LOGOS-EXPLORER-PWA` only, with `Contents: Read and write`. Not a classic token with full repo access.

Then delete `Logos Explorer Data.md` and put the new values in Vercel → Project → Settings → Environment Variables:

```
GITHUB_TOKEN          = github_pat_…
GITHUB_REPO           = hermas37/LOGOS-EXPLORER-PWA
GITHUB_BRANCH         = main
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_…
ADMIN_PASSWORD        = <something long>
```

None of these get a `NEXT_PUBLIC_` prefix. That prefix is what puts a value in the browser bundle, which is how the current build leaked them.

---

## 1. What changes, in one paragraph

Today the admin console asks you to paste a URL into a labelled field, pick a target property from a dropdown, choose a repo path, then click a separate upload button per asset — eight times per episode. The redesign inverts it: you drop all eight files at once, the app infers each file's role from its name and extension, shows you the two lanes it sorted them into, and one button does the whole publish. The only manual step left is fixing a file it couldn't classify.

---

## 2. Naming convention

Auto-detection works on keywords first, extension second. Rename your NotebookLM exports to this pattern and detection is exact every time:

```
ep03_audio_overview.mp3
ep03_video_overview.mp4
ep03_slides.pdf
ep03_infographic.png
ep03_report_briefing.md
ep03_master_script.md
ep03_flashcards.json
ep03_quiz.json
```

Detection keywords per role:

| Role | Keywords | Extensions | Destination |
|---|---|---|---|
| Audio Overview | audio, overview, deepdive, podcast | mp3 wav m4a | Blob |
| Video Overview | video, short, clip | mp4 mov webm | Blob |
| Slide Deck | slide, deck, presentation | pdf pptx | Blob |
| Infographic | infographic, poster, diagram | png jpg webp | Blob |
| Report | report, briefing, guide, faq, timeline | md txt | GitHub |
| Master Script | transcript, script, master, source | md txt | GitHub |
| Flashcards | flashcard, term, glossary | json csv md | GitHub |
| Quiz | quiz, question, assessment | json csv md | GitHub |

The rule you can state in one line to yourself: **text and data go to git, media goes to the CDN.**

---

## 3. Repo layout

```
/api
  blob-upload.ts        ← issues a client upload token
  publish.ts            ← one atomic git commit
/public
  logos-explorer-manifest.json
/episodes
  /two-windows-one-god-part-1
    master_script.md
    report_briefing.md
    flashcards.json
    quiz.json
/src
  App.tsx  UserDashboard.tsx  AdminDashboard.tsx  types.ts
```

Heavy files never enter the repo. Only their Blob URLs, recorded in the manifest.

---

## 4. Heavy files: `/api/blob-upload`

**This is the piece that fixes your upload pain.** A Vercel serverless function has a ~4.5 MB request body limit, so a 60 MB video overview can never be POSTed through your own API. `@vercel/blob/client` solves it: the browser asks your server for a short-lived token, then uploads straight to Blob storage. Your RW token stays on the server.

```ts
// api/blob-upload.ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Not authorised' });
  }

  const body = req.body as HandleUploadBody;

  const result = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: [
        'audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime',
        'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
      ],
      maximumSizeInBytes: 500 * 1024 * 1024,
      addRandomSuffix: false,
      tokenPayload: JSON.stringify({ pathname }),
    }),
    onUploadCompleted: async () => {},
  });

  return res.status(200).json(result);
}
```

Browser side:

```ts
import { upload } from '@vercel/blob/client';

const blob = await upload(`episodes/${slug}/${file.name}`, file, {
  access: 'public',
  handleUploadUrl: '/api/blob-upload',
  clientPayload: JSON.stringify({ episodeId }),
  onUploadProgress: ({ percentage }) => setProgress(file.name, percentage),
});
// blob.url goes into the manifest
```

The `onUploadProgress` callback is what drives the per-file progress bar. Without it a 60 MB upload looks frozen, which is most of why the current flow feels unreliable.

---

## 5. Light files: `/api/publish`

Your current console uses the GitHub Contents API, one PUT per file. That produces eight commits, and if the fifth fails you're left with a half-updated repo. The Git Data API commits everything as **one** commit instead — all light files plus the updated manifest, atomically.

```ts
// api/publish.ts
const GH = 'https://api.github.com';
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const gh = (path: string, init: RequestInit = {}) =>
  fetch(`${GH}/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
    return r.json();
  });

export default async function handler(req, res) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Not authorised' });
  }

  // files: [{ path, contentBase64 }]  — light assets + logos-explorer-manifest.json
  const { files, message } = req.body;

  try {
    // 1. where the branch currently points
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(`/git/commits/${baseSha}`);

    // 2. one blob per file
    const blobs = await Promise.all(
      files.map(async (f) => {
        const b = await gh('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: f.contentBase64, encoding: 'base64' }),
        });
        return { path: f.path, mode: '100644', type: 'blob', sha: b.sha };
      })
    );

    // 3. a tree layered on top of the current one
    const tree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: blobs }),
    });

    // 4. one commit
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: message || 'Publish episode',
        tree: tree.sha,
        parents: [baseSha],
      }),
    });

    // 5. move the branch — this is what triggers the Vercel build
    await gh(`/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });

    return res.status(200).json({ ok: true, commit: commit.sha });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
```

If step 2 or 3 throws, the branch never moves and the repo is untouched. That's the property you want — a failed publish leaves nothing half-written.

**Order of operations in the browser:** upload heavy files to Blob first, collect the returned URLs, build the new manifest object, then send light files + manifest to `/api/publish` in a single call. The Vercel build fires once, at the end, with everything already in place.

---

## 6. Manifest schema

```json
{
  "version": 2,
  "updatedAt": "2026-08-05T09:30:00Z",
  "episodes": [
    {
      "id": "ep-03",
      "sequence": 3,
      "slug": "no-lonely-pieces",
      "title": "No Lonely Pieces",
      "subtitle": "Divine presence in an entangled universe",
      "youtubeUrl": "https://youtu.be/…",
      "published": true,
      "assets": {
        "audioOverview": "https://….public.blob.vercel-storage.com/episodes/no-lonely-pieces/audio_overview.mp3",
        "videoOverview": "https://….public.blob.vercel-storage.com/episodes/no-lonely-pieces/video_overview.mp4",
        "slideDeck":     "https://….public.blob.vercel-storage.com/episodes/no-lonely-pieces/slides.pdf",
        "infographic":   "https://….public.blob.vercel-storage.com/episodes/no-lonely-pieces/infographic.png",
        "report":     "episodes/no-lonely-pieces/report_briefing.md",
        "transcript": "episodes/no-lonely-pieces/master_script.md",
        "flashcards": "episodes/no-lonely-pieces/flashcards.json",
        "quiz":       "episodes/no-lonely-pieces/quiz.json"
      },
      "devotional": {
        "quote": "",
        "quoteSource": "",
        "verse": "",
        "verseRef": "",
        "reflection": ""
      }
    }
  ]
}
```

Any asset key can be absent. The study view renders only the modules that exist and lists the rest as "not yet added" — no dead buttons, which is the other thing worth fixing from the current build.

**Flashcards** and **quiz** shapes:

```json
// flashcards.json
[{ "term": "λόγος", "transliteration": "logos", "definition": "…", "note": "" }]

// quiz.json
[{ "q": "…", "options": ["…","…","…","…"], "answer": 1, "why": "…" }]
```

NotebookLM won't export these shapes directly. Paste its flashcard/quiz output into Claude with the schema above and ask for conversion — that's a 10-second step and keeps the app's parser simple.

---

## 7. Build order

1. Rotate the three secrets, move to env vars, delete the credentials file.
2. Ship `/api/publish` and `/api/blob-upload` with a password gate. Confirm no token appears in the client bundle (`Ctrl+F` your deployed JS for `ghp_` and `vercel_blob`).
3. Replace the admin console with the drop zone + two lanes + one publish button.
4. Migrate the manifest to v2 and rewrite the study view to render from `assets` presence.
5. Add the devotional editor last — it's the only part that isn't blocking.

Steps 1 and 2 are worth doing this week regardless of whether you like the rest of the design.

---

## 8. One honest caution

Auto-detection is a convenience, not a guarantee. A file called `ep03_overview.md` is genuinely ambiguous — it could be a report or a script. The prototype handles this by marking low-confidence guesses in amber ("guessed from file type") rather than silently accepting them, and by refusing to publish while any file is unclassified. Keep that behaviour. A publish flow that quietly files your master script under "report" is worse than one that asks.
