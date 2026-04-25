// Contract address deployed on-chain
export const CONTRACT_ADDRESS = '0x34407ACa63877FBf116975727f70684AAc47ddF3'

// ABI matching CrowdFunding.sol
export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_goalWei', type: 'uint256' },
      { internalType: 'uint256', name: '_durationSeconds', type: 'uint256' },
      { internalType: 'bytes32', name: '_ipfsCID', type: 'bytes32' },
    ],
    name: 'createCampaign',
    outputs: [{ internalType: 'uint256', name: 'campaignId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
    name: 'contribute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
    name: 'withdrawFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'campaignCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_campaignId', type: 'uint256' }],
    name: 'getCampaign',
    outputs: [
      { internalType: 'address', name: 'creator', type: 'address' },
      { internalType: 'uint256', name: 'goalWei', type: 'uint256' },
      { internalType: 'uint256', name: 'deadlineTimestamp', type: 'uint256' },
      { internalType: 'uint256', name: 'raisedWei', type: 'uint256' },
      { internalType: 'bytes32', name: 'ipfsCID', type: 'bytes32' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_campaignId', type: 'uint256' },
      { internalType: 'address', name: '_contributor', type: 'address' },
    ],
    name: 'getContribution',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'goalWei', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'deadlineTimestamp', type: 'uint256' },
    ],
    name: 'CampaignCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'contributor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'Contributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'FundsWithdrawnEvent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'campaignId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'contributor', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'RefundIssued',
    type: 'event',
  },
]
