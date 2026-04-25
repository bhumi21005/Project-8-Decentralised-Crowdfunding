// POST /api/upload — Save campaign metadata to Vercel Blob Storage (+ optional Pinata backup)
import { put } from '@vercel/blob';
import { pinToPinata } from './_pinata.js';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { id, data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing data field in request body.' });
    }

    const blobId = id || `campaign_${Date.now()}`;
    const blobPath = `campaigns/${blobId}.json`;

    console.log(`[Upload] Saving metadata: ${blobPath}`);

    // 1. Save to Vercel Blob Storage (primary)
    const blob = await put(blobPath, JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    console.log(`[Upload] Saved to Vercel Blob: ${blob.url}`);

    // 2. Optional: Also pin to Pinata IPFS as backup
    let ipfsHash = null;
    try {
      ipfsHash = await pinToPinata(data);
    } catch (e) {
      console.warn(`[Upload] Pinata backup failed (non-critical): ${e.message}`);
    }

    return res.status(200).json({
      success: true,
      cid: blobId,
      blobUrl: blob.url,
      ipfsHash: ipfsHash || null,
    });

  } catch (error) {
    console.error(`[Upload] Error:`, error);
    return res.status(500).json({ error: 'Failed to save metadata: ' + error.message });
  }
}
