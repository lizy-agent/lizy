// Contract ABIs for on-chain data access
// Identity Registry: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
// Reputation Registry: 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
// Pudgy Penguins: 0xBd3531dA5CF5857e7CfAA92426877b022e612cf8 (Ethereum only)

export const IDENTITY_REGISTRY_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'addressToToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'addr', type: 'address' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    name: 'getSummary',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'subject', type: 'address' }],
    outputs: [
      { name: 'totalScore', type: 'int256' },
      { name: 'positiveCount', type: 'uint256' },
      { name: 'negativeCount', type: 'uint256' },
      { name: 'neutralCount', type: 'uint256' },
    ],
  },
  {
    name: 'readFeedback',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'subject', type: 'address' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'entries',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'score', type: 'int8' },
          { name: 'comment', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

export const PUDGY_PENGUINS_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokensOfOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

// ERC-8183 Agentic Commerce Protocol (ACP)
// Job state machine: Open(0) → Funded(1) → Submitted(2) → Completed(3)/Rejected(4)/Expired(5)
export const ACP_ABI = [
  {
    name: 'getJob',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id',          type: 'uint256' },
          { name: 'client',      type: 'address' },
          { name: 'provider',    type: 'address' },
          { name: 'evaluator',   type: 'address' },
          { name: 'description', type: 'string'  },
          { name: 'budget',      type: 'uint256' },
          { name: 'expiredAt',   type: 'uint256' },
          { name: 'status',      type: 'uint8'   },
          { name: 'hook',        type: 'address' },
        ],
      },
    ],
  },
  {
    name: 'jobCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'platformFeeBP',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Uniswap V3 Pool ABI (minimal, for price queries)
export const UNISWAP_V3_POOL_ABI = [
  {
    name: 'slot0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
  },
  {
    name: 'token0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'token1',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'liquidity',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }],
  },
] as const;
