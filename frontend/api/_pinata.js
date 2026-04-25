// Shared Pinata IPFS helper — filename starts with _ so Vercel does NOT treat it as a route
import https from 'https';

/**
 * Make an HTTPS request (used for Pinata API calls and IPFS gateway fetches).
 */
function makeHttpsRequest(url, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', error => reject(error));
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Pin JSON metadata to Pinata IPFS.
 * Returns the IPFS hash (CID) on success, or null on failure.
 */
export async function pinToPinata(metadata) {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.log('[Pinata] No credentials configured, skipping.');
    return null;
  }

  try {
    const payload = JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `Campaign_${Date.now()}.json` }
    });

    const response = await makeHttpsRequest('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, payload);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const data = JSON.parse(response.data);
      console.log(`[Pinata] Pinned successfully: ${data.IpfsHash}`);
      return data.IpfsHash;
    }

    console.warn(`[Pinata] API returned status ${response.statusCode}: ${response.data}`);
    return null;
  } catch (error) {
    console.error(`[Pinata] Upload error: ${error.message}`);
    return null;
  }
}

/**
 * Fetch metadata from IPFS gateways.
 * Tries multiple gateways in order. Returns parsed JSON or null.
 */
export async function fetchFromIPFS(cid) {
  if (!cid || (!cid.startsWith('Qm') && !cid.startsWith('bafy'))) {
    return null;
  }

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];

  for (const url of gateways) {
    try {
      const response = await makeHttpsRequest(url, { method: 'GET' });
      if (response.statusCode === 200) {
        console.log(`[IPFS] Found on gateway: ${url}`);
        return JSON.parse(response.data);
      }
    } catch (e) {
      // Continue to next gateway
    }
  }

  return null;
}
