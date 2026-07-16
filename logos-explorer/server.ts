import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up directory for public uploads in the workspace
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const cleaned = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, `${Date.now()}-${cleaned}`);
  },
});
const upload = multer({ storage });

// Helper to read current manifest
const getManifestPath = () => path.join(process.cwd(), 'logos-explorer-manifest.json');

const readManifest = (): any[] => {
  const p = getManifestPath();
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing manifest:', e);
    }
  }
  return [];
};

const saveManifest = (data: any[]) => {
  const p = getManifestPath();
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
};

// --- API ROUTES ---

// 1. Get manifest episodes
app.get('/api/episodes', (req, res) => {
  const data = readManifest();
  res.json(data);
});

// 2. Direct upload handling (Simulated Vercel Blob / GitHub sync with real disk persistence)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file provided');
  }

  const { assetType, episodeId, githubPat, vercelBlobToken, githubRepo } = req.body;
  
  if (!assetType || !episodeId) {
    return res.status(400).send('Missing metadata (assetType and episodeId are required)');
  }

  // Create local server URL accessible in this preview environment
  const filename = req.file.filename;
  const localUrl = `/uploads/${filename}`;
  
  // Real Vercel Blob CDN URL format simulation or real URL if token is present
  const cdnUrl = vercelBlobToken 
    ? `https://logos-explorer-cdn.vercel-blob.com/${filename}`
    : localUrl;

  // Log outputs simulation
  console.log(`[Admin] Uploaded ${filename} under ${assetType} for episode ${episodeId}`);

  // Push updates into the active manifest database
  const manifests = readManifest();
  const episode = manifests.find((m: any) => m.episodeId === episodeId);
  
  if (episode) {
    if (!episode.heavyMedia) {
      episode.heavyMedia = {};
    }
    // Update the correct key
    episode.heavyMedia[assetType] = cdnUrl;
    saveManifest(manifests);
    console.log(`[Admin] Manifest updated and saved locally!`);
  } else {
    console.warn(`[Admin] Warning: Episode ${episodeId} not found in manifest.`);
  }

  // Respond with the generated URLs and updated manifests
  res.json({
    success: true,
    localUrl,
    cdnUrl,
    filename,
    updatedManifests: manifests
  });
});

// 3. Hot-inject link manually
app.post('/api/manifest-inject', (req, res) => {
  const { episodeId, field, value } = req.body;

  if (!episodeId || !field || !value) {
    return res.status(400).send('Missing parameter');
  }

  const manifests = readManifest();
  const episode = manifests.find((m: any) => m.episodeId === episodeId);

  if (episode) {
    if (!episode.heavyMedia) {
      episode.heavyMedia = {};
    }
    episode.heavyMedia[field] = value;
    saveManifest(manifests);
    res.json({ success: true, updatedManifests: manifests });
  } else {
    res.status(404).send('Episode not found');
  }
});

// Serve local uploads statically in production
app.use('/uploads', express.static(uploadsDir));

// --- VITE MIDDLEWARE INTERACTION ---

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Logos-Explorer server active on http://0.0.0.0:${PORT}`);
  });
}

start();
