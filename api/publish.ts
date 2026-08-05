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

  const { files, message } = req.body as {
    files: { path: string; contentBase64: string }[];
    message?: string;
  };

  if (!files?.length) return res.status(400).json({ error: 'No files sent' });

  try {
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(`/git/commits/${baseSha}`);

    const tree = await Promise.all(
      files.map(async (f) => {
        const blob = await gh('/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: f.contentBase64, encoding: 'base64' }),
        });
        return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
      })
    );

    const newTree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });

    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: message || 'Publish episode',
        tree: newTree.sha,
        parents: [baseSha],
      }),
    });

    await gh(`/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });

    return res.status(200).json({ ok: true, commit: commit.sha });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
