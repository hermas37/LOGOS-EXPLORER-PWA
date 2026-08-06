# Logos Explorer — step by step, from the beginning

Written for someone who has never added a serverless function before. Every step says what to do, how to know it worked, and what to do when it doesn't.

**Your stack, confirmed from the repo:** Vite 6 + React 19 + Tailwind 4 + `lucide-react` + an Express `server.ts`. Node scripts are npm-flavoured (`npm run dev` → `tsx server.ts`).

**Total time:** roughly 6–8 hours, best split across four sittings. Parts 1 and 2 are the urgent ones.

---

## Before you begin

Open PowerShell and go to the project:

```powershell
cd D:\projects\LOGOS-EXPLORER-PWA
```

If it isn't there yet:

```powershell
cd D:\projects
git clone https://github.com/hermas37/LOGOS-EXPLORER-PWA.git
cd LOGOS-EXPLORER-PWA
npm install
```

Make a safety branch so you can always go back:

```powershell
git checkout -b redesign
```

Everything below happens on the `redesign` branch. Your live site keeps running from `main` the whole time.

---

# PART 1 — Lock the doors

**Do this today, even if you do nothing else.** Your repo is public and three secrets are exposed.

### Step 1 — Find out how bad it is

Two checks. First, is a token sitting inside your deployed JavaScript?

```powershell
npm run build
Select-String -Path .\dist\assets\*.js -Pattern "ghp_|github_pat_|vercel_blob_rw|AQ\.Ab8"
```

Second, is a token in your git history?

```powershell
git log --all --oneline -S "ghp_"
git log --all --oneline -S "vercel_blob_rw"
```

**How to read the result:** any output at all means yes, it's exposed. No output means you probably typed the tokens into the browser at runtime instead — better, but they still need rotating, because they've now been in a chat.

Either way, continue to Step 2. Don't skip it because a check came back clean.

### Step 2 — Kill the GitHub token

1. Go to **github.com** → click your avatar → **Settings**
2. Scroll to the bottom of the left sidebar → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. Find the token starting `ghp_TSma` → **Delete**

It is now dead. Nothing can use it. Good.

### Step 3 — Make a safer replacement

Still in Developer settings:

1. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. **Token name:** `logos-explorer-publish`
3. **Expiration:** 90 days
4. **Repository access:** choose **Only select repositories** → pick `LOGOS-EXPLORER-PWA`
5. **Permissions** → **Repository permissions** → find **Contents** → set to **Read and write**
6. Leave everything else alone. **Generate token.**

Copy the token — it starts with `github_pat_`. You can only see it once. Paste it into Notepad for the next fifteen minutes, then close Notepad without saving.

> **Why fine-grained?** The old token could touch every repo you own. This one can only write files to this one repo. If it leaks again, the damage is contained.

### Step 4 — Rotate the Vercel Blob token

1. Go to **vercel.com** → your project → **Storage** tab
2. Click your Blob store
3. Open the **Settings** or **Tokens** section for that store and create a fresh read-write token; delete the old one

Copy the new value (starts `vercel_blob_rw_`).

> **Worth knowing:** Vercel now prefers short-lived OIDC tokens for server code, and pairs `BLOB_STORE_ID` with `VERCEL_OIDC_TOKEN` automatically when a store is connected to a project. But the browser-upload flow you need still requires the long-lived `BLOB_READ_WRITE_TOKEN` — it's what signs the client upload tokens. So keep it, just keep it server-side.

### Step 5 — Rotate the Gemini key

1. **aistudio.google.com** → **Get API key**
2. Delete the key starting `AQ.Ab8R`
3. Create a new one, copy it

### Step 6 — Stop the leak from happening again

Check your `.gitignore` contains these lines:

```powershell
notepad .gitignore
```

It must include:

```
.env
.env.local
*.local
dist
node_modules
```

Save. Then delete the credentials file from your machine entirely — don't keep a copy in the project folder.

```powershell
Remove-Item ".\Logos Explorer Data.md" -ErrorAction SilentlyContinue
```

✅ **Part 1 checkpoint:** all three old secrets are dead, three new ones are in Notepad, `.gitignore` covers env files.

---

# PART 2 — Put the new secrets somewhere safe

### Step 7 — Add them to Vercel

1. **vercel.com** → your project → **Settings** → **Environment Variables**
2. Add each of these. For every one, tick **Production**, **Preview**, and **Development**:

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | your `github_pat_…` |
| `GITHUB_REPO` | `hermas37/LOGOS-EXPLORER-PWA` |
| `GITHUB_BRANCH` | `main` |
| `BLOB_READ_WRITE_TOKEN` | your `vercel_blob_rw_…` |
| `ADMIN_PASSWORD` | invent a long one, e.g. `maximus-logoi-2026-atlas` |
| `GEMINI_API_KEY` | your new Gemini key |

3. **Save**

> **The single most important rule in this whole guide:** never put `VITE_` in front of any of these names. In a Vite project, `VITE_` is the prefix that says "copy this into the browser bundle." That prefix is how secrets end up public. Plain names stay on the server.

### Step 8 — Add them locally too

```powershell
notepad .env.local
```

Paste the same six lines in this format, then save:

```
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=hermas37/LOGOS-EXPLORER-PWA
GITHUB_BRANCH=main
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ADMIN_PASSWORD=maximus-logoi-2026-atlas
GEMINI_API_KEY=...
```

Confirm git is ignoring it:

```powershell
git status
```

`.env.local` must **not** appear in the list. If it does, your `.gitignore` is wrong — go back to Step 6.

Now close Notepad and clear your clipboard.

✅ **Part 2 checkpoint:** secrets live in Vercel and in an ignored local file. Nothing is in the repo.

---

# PART 3 — Build the publish engine

This is the part that makes the drop zone work. Two small server files.

### Step 9 — Install the two packages you need

```powershell
npm install @vercel/blob
npm install -D @vercel/node
```

### Step 10 — Create the `api` folder

Vercel treats a top-level folder named `api` specially: every file in it becomes its own small server function, automatically, alongside your Vite site. You don't have to configure anything.

```powershell
mkdir api
```

### Step 11 — Create `api/blob-upload.ts`

```powershell
notepad api\blob-upload.ts
```

Paste this whole file and save:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const body = req.body as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req as any,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // The browser sends the admin password inside clientPayload.
        // No password, no upload token.
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        if (payload.password !== process.env.ADMIN_PASSWORD) {
          throw new Error('Not authorised');
        }
        return {
          allowedContentTypes: [
            'audio/mpeg', 'audio/wav', 'audio/mp4',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf',
            'image/png', 'image/jpeg', 'image/webp',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {
        // Nothing needed here — the browser gets the URL directly.
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
```

**What this file does, in plain terms:** the browser asks it "may I upload this file?" It checks the password, then hands back a one-use permission slip. The browser then sends the file *straight to Vercel's storage* — never through your server.

> **Why it has to work this way:** a Vercel function can only receive about 4.5 MB in one request. Your video overview might be 60 MB. It physically cannot pass through your own API. This permission-slip pattern is the only way to move large files, and it's also why the old flow felt broken.

### Step 12 — Create `api/publish.ts`

```powershell
notepad api\publish.ts
```

Paste and save:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPO = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

async function gh(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  // files: [{ path: 'episodes/xxx/report.md', contentBase64: '...' }, ...]
  const { files, message } = req.body as {
    files: { path: string; contentBase64: string }[];
    message?: string;
  };

  if (!files?.length) return res.status(400).json({ error: 'No files sent' });

  try {
    // 1. Where does the branch point right now?
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(`/git/commits/${baseSha}`);

    // 2. Upload each file's contents and get an id back
    const tree = await Promise.all(
      files.map(async (f) => {
        const blob = await gh('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: f.contentBase64, encoding: 'base64' }),
        });
        return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
      })
    );

    // 3. Build a new folder snapshot on top of the current one
    const newTree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });

    // 4. Make one commit containing all of it
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: message || 'Publish episode',
        tree: newTree.sha,
        parents: [baseSha],
      }),
    });

    // 5. Move the branch. This is what tells Vercel to rebuild.
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

**What this file does:** takes all your text files plus the updated manifest and saves them as **one** commit. Your current console saves them one at a time, so if the fifth one fails you're left half-updated. Here, if anything fails before step 5, the branch never moves and your repo is untouched.

### Step 13 — Give the functions a little more time

```powershell
notepad vercel.json
```

Paste and save:

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Step 14 — Deploy and test the engine before touching any UI

```powershell
git add .
git commit -m "Add server-side publish and blob upload functions"
git push -u origin redesign
```

Go to **vercel.com** → your project → **Deployments**. A new **Preview** deployment for the `redesign` branch will appear. Wait for it to say **Ready**, then copy its URL (something like `logos-explorer-pwa-git-redesign-hermas37.vercel.app`).

Test the password gate — replace the URL with yours:

```powershell
curl.exe -X POST "https://YOUR-PREVIEW-URL.vercel.app/api/publish" `
  -H "Content-Type: application/json" `
  -H "x-admin-password: wrong" `
  -d "{\"files\":[]}"
```

**Expected:** `{"error":"Wrong password"}`

Now with the real password:

```powershell
curl.exe -X POST "https://YOUR-PREVIEW-URL.vercel.app/api/publish" `
  -H "Content-Type: application/json" `
  -H "x-admin-password: maximus-logoi-2026-atlas" `
  -d "{\"files\":[]}"
```

**Expected:** `{"error":"No files sent"}`

That second message is the win. It means the password passed and the function is alive.

**If you get a 404:** the `api` folder isn't at the top level of the repo, or the file isn't named exactly `publish.ts`.
**If you get a 500 mentioning `GITHUB_REPO`:** the environment variables weren't ticked for **Preview**. Go back to Step 7.

> **Why test on a preview URL instead of localhost?** Your local `npm run dev` runs `tsx server.ts` — an Express server that knows nothing about the `api` folder. Emulating Vercel functions locally means learning `vercel dev` on top of everything else. Pushing to a branch gives you a real environment in about forty seconds, and it can't break your live site.

✅ **Part 3 checkpoint:** you have a working, password-protected publish engine on a preview URL. No token has touched a browser.

---

# PART 4 — Rebuild the admin screen

Now the visible part. You have `LogosExplorer.jsx` from the prototype — it's the shape to build toward, with the publishing simulated. This part connects it to the real functions.

### Step 15 — Drop the prototype in as a reference

Save `LogosExplorer.jsx` into `src\prototype\LogosExplorer.jsx`. You won't ship this file; it's the spec.

### Step 16 — Let Claude Code do the wiring

Open Claude Code in the project folder:

```powershell
cd D:\projects\LOGOS-EXPLORER-PWA
claude
```

Give it this, adjusting nothing:

> Read `src/prototype/LogosExplorer.jsx`, the existing `src/AdminDashboard.tsx`, and `api/publish.ts` and `api/blob-upload.ts`.
>
> Rewrite `src/AdminDashboard.tsx` to match the prototype's admin flow: one drop zone, automatic role detection, two lanes (light → GitHub, heavy → Blob), and a single publish button.
>
> Wire it to the real backend:
> - Heavy files (audio, video, pdf, images) use `upload()` from `@vercel/blob/client` with `handleUploadUrl: '/api/blob-upload'`, passing `clientPayload: JSON.stringify({ password })`. Show real per-file progress using `onUploadProgress`.
> - Light files (md, txt, json, csv) are read with `FileReader.readAsDataURL`, stripped to base64, and sent together with the updated manifest in ONE POST to `/api/publish` with the `x-admin-password` header.
> - Upload heavy files first, collect their returned URLs, build the manifest, then call `/api/publish` once.
> - The admin password is entered once in a field and held in React state only. Never in localStorage. Never in a `VITE_` variable.
>
> Give me the complete replacement file, not a patch. Use the existing Tailwind 4 setup and `lucide-react`. Keep TypeScript types in `types.ts` updated.

Review what it writes before accepting. The one thing to check by eye: **search the generated file for `VITE_` and for the word `token`.** Neither should appear anywhere near the GitHub or Blob credentials.

### Step 17 — Test with small files first

Push, wait for the preview deploy, open the preview URL, go to the admin tab.

Test in this order — don't skip ahead:

1. One small `.md` file only. Publish. Check GitHub for a new commit.
2. One small `.png`. Publish. Check the Vercel Blob store for the file.
3. One real audio overview (20 MB+). Watch the progress bar actually move.
4. All eight files at once.

**If the audio upload hangs at 0%:** the `clientPayload` password isn't matching. Check for a stray space.
**If GitHub returns 409:** something else changed the branch mid-publish. Just publish again.
**If a `.md` arrives on GitHub as gibberish:** the base64 conversion kept the `data:...;base64,` prefix. It must be stripped.

✅ **Part 4 checkpoint:** you can drop eight files and publish them with one click.

---

# PART 5 — Rebuild the study screen

### Step 18 — Move the manifest to version 2

Your current `logos-explorer-manifest.json` sits at the repo root. Open it and compare it to the v2 schema in `logos-explorer-implementation.md` (section 6).

Ask Claude Code:

> Read `logos-explorer-manifest.json` and convert it to the v2 schema in `logos-explorer-implementation.md`. Keep every existing episode and its data. Write a complete replacement file. Then update `types.ts` to match.

### Step 19 — Rebuild the user view

> Read `src/prototype/LogosExplorer.jsx` and rewrite `src/UserDashboard.tsx` to match its study view: episode rail, hero with the YouTube link, the cream devotional panel, and a grid of study modules.
>
> Render a module **only if** its key exists in `episode.assets`. Never render a disabled or dead button. List absent modules as plain text under "not yet added".
>
> Complete replacement file. Tailwind 4 and `lucide-react`.

This "only render what exists" rule is what lets you publish an episode with just an audio overview on day one and add slides a week later, without the app ever looking broken.

✅ **Part 5 checkpoint:** the study side renders from the manifest and adapts to whatever exists.

---

# PART 6 — Go live

### Step 20 — Merge

```powershell
git checkout main
git merge redesign
git push
```

Watch the production deployment finish, then open **explorerlogos.online**.

### Step 21 — Prove the leak is closed

On the live site, press **Ctrl+U** to view source, then **Ctrl+F** and search for:

- `ghp_`
- `github_pat_`
- `vercel_blob_rw`

All three must return nothing. Do the same in DevTools → **Sources** → search across all files. If anything turns up, stop and find it before publishing another episode.

### Step 22 — Your routine from now on

For each new episode:

1. In NotebookLM, generate the Studio outputs from your single source story
2. Download them all to one folder
3. Rename using the convention in the implementation notes (`ep04_audio_overview.mp3`, `ep04_flashcards.json`, and so on)
4. Open the admin tab, type your password, pick or create the episode
5. Select all files → drag into the drop zone
6. Fix anything flagged amber
7. Write the quotation, verse, and reflection
8. **Publish**

Steps 4–8 should take under five minutes once the files are named.

---

## If you get stuck

The most useful thing you can do is copy the exact error text. In the browser, **F12** → **Console** tab for front-end errors. In Vercel, **Deployments** → click the deployment → **Functions** tab for server errors. Paste the error into Claude Code along with the file it came from.

## One honest note on sequencing

Parts 1 and 2 are security work and take about ninety minutes. Parts 3 onward are a redesign, and redesigns always take longer than planned — you may find yourself wanting to change the study view once you see it with real content. That's fine and normal. But finish Parts 1 and 2 in one sitting and don't leave them half-done overnight, because a half-rotated set of credentials on a public repo is worse than either state on its own.
