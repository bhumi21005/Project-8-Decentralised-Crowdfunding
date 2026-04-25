import { formatEther, parseEther, keccak256, toUtf8Bytes } from 'ethers'
import bs58 from 'bs58'

export const STATUS_LABELS = ['Active', 'Successful', 'Failed', 'FundsWithdrawn']
export const STATUS_CLASSES = ['status-active', 'status-successful', 'status-failed', 'status-withdrawn']

export function truncateAddress(addr) {
  if (!addr) return '—'
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

export function weiToEth(weiStr) {
  try {
    return formatEther(weiStr)
  } catch {
    const wei = BigInt(weiStr)
    return (Number(wei) / 1e18).toFixed(4)
  }
}

export function ethToWei(ethStr) {
  try {
    return parseEther(ethStr)
  } catch {
    const [whole, dec = ''] = ethStr.split('.')
    const padded = (dec + '000000000000000000').slice(0, 18)
    return BigInt(whole || '0') * BigInt(10 ** 18) + BigInt(padded)
  }
}

export function formatDeadline(timestamp) {
  const date = new Date(Number(timestamp) * 1000)
  const now = new Date()
  if (date <= now) return 'Ended ' + date.toLocaleDateString()
  const diff = date - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m remaining`
}

export function cidToBytes32(cidStr) {
  if (!cidStr) return '0x' + '00'.repeat(32)
  if (cidStr.startsWith('0x') && cidStr.length === 66) return cidStr
  try {
    const decoded = bs58.decode(cidStr);
    const bytes32 = decoded.slice(2);
    let hex = '0x';
    for (let i = 0; i < bytes32.length; i++) {
      hex += bytes32[i].toString(16).padStart(2, '0');
    }
    return hex;
  } catch (e) {
    console.error('Error decoding CID', e);
    return '0x' + '00'.repeat(32);
  }
}

export function bytes32ToCid(bytes32Hex) {
  if (!bytes32Hex || bytes32Hex === '0x' + '00'.repeat(32)) return null;
  try {
    const hex = bytes32Hex.startsWith('0x') ? bytes32Hex.slice(2) : bytes32Hex;
    const bytes32 = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes32[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    const cidBytes = new Uint8Array(34);
    cidBytes[0] = 0x12; // SHA-256
    cidBytes[1] = 0x20; // 32 bytes length
    cidBytes.set(bytes32, 2);
    return bs58.encode(cidBytes);
  } catch (e) {
    console.error('Error encoding CID', e);
    return null;
  }
}

export const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  5: 'Goerli',
  11155111: 'Sepolia',
  31337: 'Anvil (Local)',
  1337: 'Local Dev',
  137: 'Polygon',
  80001: 'Mumbai',
}

// ─── Backend API base URL ──────────────────────────────
// In dev, Vite proxy forwards /api -> http://localhost:3001/api
// In production, same origin serves both frontend and API
const API_BASE = '/api'

/**
 * Upload campaign metadata to the backend server.
 * The server handles Pinata IPFS upload with local fallback.
 * API keys are kept server-side only — never exposed to the browser.
 */
export async function uploadToPinata(metadata) {
  // Generate a deterministic local ID (keccak256 hash of the metadata)
  const jsonStr = JSON.stringify(metadata);
  const localId = keccak256(toUtf8Bytes(jsonStr));

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: localId, data: metadata })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Metadata upload failed.');
  }

  const resData = await response.json();
  const finalCid = resData.cid; // Could be IPFS CID (Qm...) or Local ID (0x...)

  // If it's a real IPFS CID, convert it to bytes32. Otherwise, use the raw hex ID.
  if (typeof finalCid === 'string' && finalCid.startsWith('Qm')) {
    return cidToBytes32(finalCid);
  }
  return finalCid;
}

/**
 * Load campaign metadata from the backend server.
 * The server checks local storage first, then IPFS gateways.
 * 
 * Strategy: Try the raw hex identifier first (for locally-saved metadata),
 * then try the decoded CID (for IPFS-pinned metadata).
 */
export async function loadFromIPFS(cidBytes32) {
  if (!cidBytes32 || cidBytes32 === '0x' + '00'.repeat(32)) return null;

  // Attempt 1: Try the raw hex value directly (matches local filenames like 0xabc...123.json)
  try {
    const response = await fetch(`${API_BASE}/ipfs/${cidBytes32}`);
    if (response.ok) {
      const data = await response.json();
      if (data && (data.title || data.description)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Failed to load with raw hex ID:', e);
  }

  // Attempt 2: Try decoding as a base58 CID (for IPFS-pinned content)
  const decodedCid = bytes32ToCid(cidBytes32);
  if (decodedCid && decodedCid !== cidBytes32) {
    try {
      const response = await fetch(`${API_BASE}/ipfs/${decodedCid}`);
      if (response.ok) {
        const data = await response.json();
        if (data && (data.title || data.description)) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to load with decoded CID:', e);
    }
  }

  return null;
}
