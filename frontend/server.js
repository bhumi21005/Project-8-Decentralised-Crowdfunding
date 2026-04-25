import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load .env from project root ───────────────────────
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^#]+?)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

// ─── Constants ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const METADATA_DIR = path.join(__dirname, 'metadata');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Ensure metadata directory exists
if (!fs.existsSync(METADATA_DIR)) {
  fs.mkdirSync(METADATA_DIR, { recursive: true });
}

// ─── Express App ───────────────────────────────────────
const app = express();

// CORS — restrict in production, open in dev
if (IS_PRODUCTION) {
  app.use(cors({ origin: false })); // same-origin only
} else {
  app.use(cors()); // allow all origins in dev
}

app.use(express.json());

// ─── Serve static frontend build in production ────────
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
}

// ─── Helper: HTTPS request ─────────────────────────────
function makeHttpsRequest(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', error => reject(error));
    if (body) req.write(body);
    req.end();
  });
}

// ─── POST /api/upload — Save metadata to Pinata (or local fallback) ───
app.post('/api/upload', async (req, res) => {
  const { id, data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'Missing data field in request body.' });
  }

  const localId = id || `campaign_${Date.now()}`;
  console.log(`[Server] Upload request for ID: ${localId}`);

  // 1. Try Pinata IPFS first
  if (PINATA_API_KEY && PINATA_API_SECRET) {
    try {
      const payload = JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: `Campaign_${Date.now()}.json` }
      });

      const response = await makeHttpsRequest('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET,
          'Content-Length': Buffer.byteLength(payload)
        }
      }, payload);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        const pinataData = JSON.parse(response.data);
        console.log(`[Server] Successfully pinned to IPFS: ${pinataData.IpfsHash}`);

        // Also save locally as backup using the original hex ID
        try {
          const filePath = path.join(METADATA_DIR, `${localId}.json`);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          console.log(`[Server] Also saved locally as backup: ${localId}.json`);
        } catch (backupErr) {
          console.warn(`[Server] Local backup failed: ${backupErr.message}`);
        }

        return res.json({ success: true, cid: pinataData.IpfsHash });
      }

      console.warn(`[Server] Pinata returned status ${response.statusCode}: ${response.data}. Falling back to local storage.`);
    } catch (error) {
      console.error(`[Server] Pinata upload error: ${error.message}. Falling back to local storage.`);
    }
  } else {
    console.warn('[Server] Pinata credentials missing. Using local storage only.');
  }

  // 2. Fallback: Save to local filesystem
  try {
    const filePath = path.join(METADATA_DIR, `${localId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[Server] Metadata saved locally to ${localId}.json`);
    return res.json({ success: true, cid: localId });
  } catch (err) {
    console.error(`[Server] Local save failed: ${err.message}`);
    return res.status(500).json({ error: 'Failed to save metadata.' });
  }
});

// ─── GET /api/ipfs/:id — Retrieve metadata (local first, then IPFS gateways) ───
app.get('/api/ipfs/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Server] Fetch request for ID: ${id}`);

  // 1. Try local filesystem first (exact filename match)
  const localPath = path.join(METADATA_DIR, `${id}.json`);
  if (fs.existsSync(localPath)) {
    try {
      const data = fs.readFileSync(localPath, 'utf8');
      console.log(`[Server] Found locally: ${id}.json`);
      return res.json(JSON.parse(data));
    } catch (e) {
      console.error(`[Server] Error reading local file ${id}: ${e.message}`);
    }
  }

  // 2. Try all local files (in case the ID was stored under a different name)
  try {
    const files = fs.readdirSync(METADATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(METADATA_DIR, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Check if this file's name (without .json) matches the requested id
          const fileName = file.replace('.json', '');
          if (fileName === id) {
            console.log(`[Server] Found local match: ${file}`);
            return res.json(JSON.parse(content));
          }
        } catch (e) {
          // Skip unreadable files
        }
      }
    }
  } catch (e) {
    console.error(`[Server] Error scanning metadata directory: ${e.message}`);
  }

  // 3. Fallback to IPFS Gateways (for real Qm... CIDs)
  if (id.startsWith('Qm') || id.startsWith('bafy')) {
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${id}`,
      `https://ipfs.io/ipfs/${id}`,
      `https://cloudflare-ipfs.com/ipfs/${id}`
    ];

    for (const url of gateways) {
      try {
        console.log(`[Server] Trying IPFS gateway: ${url}`);
        const response = await makeHttpsRequest(url, { method: 'GET' });
        if (response.statusCode === 200) {
          console.log(`[Server] Found on IPFS gateway: ${url}`);
          return res.json(JSON.parse(response.data));
        }
      } catch (e) {
        // Continue to next gateway
      }
    }
  }

  console.warn(`[Server] Metadata not found for ID: ${id}`);
  res.status(404).json({ error: 'Metadata not found locally or on IPFS gateways.' });
});

// ─── SPA fallback for production ───────────────────────
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found. Run "npm run build" first.');
    }
  });
}

// ─── Start Server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`);
  console.log(`[Server] Mode: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`[Server] Pinata: ${PINATA_API_KEY ? 'Configured ✓' : 'Not configured (local-only mode)'}`);
  console.log(`[Server] Metadata dir: ${METADATA_DIR}`);
});
