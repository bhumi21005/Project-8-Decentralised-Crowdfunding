// GET /api/ipfs/[id] — Retrieve campaign metadata by ID
// Checks Vercel Blob Storage first, then IPFS gateways as fallback
import { list } from '@vercel/blob';
import { fetchFromIPFS } from '../_pinata.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing ID parameter.' });
  }

  console.log(`[Fetch] Looking up metadata for: ${id}`);

  // 1. Try Vercel Blob Storage (primary)
  try {
    const { blobs } = await list({ prefix: `campaigns/${id}.json` });

    if (blobs.length > 0) {
      console.log(`[Fetch] Found in Vercel Blob: ${blobs[0].url}`);
      const response = await fetch(blobs[0].url);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    }
  } catch (error) {
    console.error(`[Fetch] Vercel Blob error: ${error.message}`);
  }

  // 2. Try IPFS gateways (for CIDs like Qm... or bafy...)
  if (id.startsWith('Qm') || id.startsWith('bafy')) {
    try {
      const ipfsData = await fetchFromIPFS(id);
      if (ipfsData) {
        console.log(`[Fetch] Found on IPFS gateway`);
        return res.status(200).json(ipfsData);
      }
    } catch (error) {
      console.error(`[Fetch] IPFS gateway error: ${error.message}`);
    }
  }

  console.warn(`[Fetch] Metadata not found for: ${id}`);
  return res.status(404).json({ error: 'Metadata not found.' });
}
