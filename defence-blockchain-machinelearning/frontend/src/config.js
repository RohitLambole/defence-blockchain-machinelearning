// ─────────────────────────────────────────────────────────────
//  CONFIGURE THESE VALUES after deploying your contracts
//  Run: truffle migrate --network development
//  Then paste the printed addresses below.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  // Backend API base URL (Express server)
  API_URL: 'http://localhost:5000',

  // Local Ganache RPC
  RPC_URL: 'http://127.0.0.1:8545',

  // Paste your deployed contract addresses here:
  RBAC_ADDRESS: '0xYOUR_RBAC_CONTRACT_ADDRESS',
  AMMO_ADDRESS: '0xYOUR_AMMO_CONTRACT_ADDRESS',
};

// ─────────────────────────────────────────────────────────────
//  Minimal ABIs (only what the UI needs to read)
// ─────────────────────────────────────────────────────────────

export const RBAC_ABI = [
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function ROLE_CHEMICAL_SUPPLIER() view returns (bytes32)',
  'function ROLE_METALLURGY_SUPPLIER() view returns (bytes32)',
  'function ROLE_MANUFACTURER() view returns (bytes32)',
  'function ROLE_ASSEMBLER() view returns (bytes32)',
  'function ROLE_QUALITY_CONTROL() view returns (bytes32)',
  'function ROLE_AUDITOR() view returns (bytes32)',
  'function ROLE_INVENTORY() view returns (bytes32)',
  'function ROLE_COMMAND() view returns (bytes32)',
];

export const AMMO_ABI = [
  'function batches(uint256) view returns (uint256 batchId, uint256 manufactureDate, bytes32 secretHash, bytes32 currentLocation, bytes32 pendingLocation, bool isAmbiguous)',
  'function nodeTimestamps(uint256 tokenId, bytes32 role) view returns (uint256)',
  'event BatchMinted(uint256 indexed batchId, address indexed minter, bytes32 secretHash, uint256 timestamp)',
  'event TransferInitiated(uint256 indexed batchId, bytes32 fromRole, bytes32 toRole, uint256 timestamp)',
  'event TransferVerified(uint256 indexed batchId, bytes32 newLocation, address auditor, uint256 timestamp)',
  'event AmbiguityFlagged(uint256 indexed batchId, address auditor, uint256 timestamp)',
];

// Material type options matching the MongoDB schema enum
export const MATERIAL_TYPES = [
  'Chemical powder',
  'chemical explosive',
  'brass/steel metallurgy',
  'ammunition',
];

// Role display names
export const ROLE_LABELS = {
  CHEMICAL_SUPPLIER: 'Chemical Supplier',
  METALLURGY_SUPPLIER: 'Metallurgy Supplier',
  MANUFACTURER: 'Manufacturer',
  ASSEMBLER: 'Assembler',
  QUALITY_CONTROL: 'Quality Control',
  AUDITOR: 'Auditor',
  INVENTORY: 'Base Inventory',
  COMMAND: 'Command Officer',
};

export const TRANSFER_DESTINATIONS = [
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'ASSEMBLER', label: 'Assembler' },
  { value: 'QUALITY_CONTROL', label: 'Quality Control' },
  { value: 'INVENTORY', label: 'Base Inventory' },
  { value: 'COMMAND', label: 'Command' },
];
