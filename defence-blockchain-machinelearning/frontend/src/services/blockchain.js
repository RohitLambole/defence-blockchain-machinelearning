import { ethers } from 'ethers';
import { CONFIG, RBAC_ABI, AMMO_ABI } from '../config';

// Get a read-only provider (no wallet needed for reads)
const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(CONFIG.RPC_URL);
};

// ── RBAC contract (read-only) ────────────────────────────────
export const getRbacContract = async () => {
  const provider = getProvider();
  const signer = await provider.getSigner().catch(() => provider);
  return new ethers.Contract(CONFIG.RBAC_ADDRESS, RBAC_ABI, signer);
};

// ── AmmunitionAsset contract (read-only) ─────────────────────
export const getAmmoContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(CONFIG.AMMO_ADDRESS, AMMO_ABI, provider);
};

// ── Detect role from RBAC contract ───────────────────────────
export const detectRole = async (address) => {
  try {
    const rbac = await getRbacContract();

    const roleNames = [
      'ROLE_COMMAND',
      'ROLE_AUDITOR',
      'ROLE_QUALITY_CONTROL',
      'ROLE_CHEMICAL_SUPPLIER',
      'ROLE_METALLURGY_SUPPLIER',
      'ROLE_MANUFACTURER',
      'ROLE_ASSEMBLER',
      'ROLE_INVENTORY',
    ];

    for (const roleName of roleNames) {
      const roleHash = await rbac[roleName]();
      const has = await rbac.hasRole(roleHash, address);
      if (has) return roleName.replace('ROLE_', '');
    }
    return 'UNKNOWN';
  } catch (err) {
    console.warn('Role detection failed (check contract address in config.js):', err.message);
    return 'UNKNOWN';
  }
};

// ── Read batch data from blockchain ──────────────────────────
export const getBatchFromChain = async (batchId) => {
  try {
    const contract = await getAmmoContract();
    const data = await contract.batches(batchId);
    return {
      batchId: Number(data.batchId),
      manufactureDate: Number(data.manufactureDate),
      secretHash: data.secretHash,
      currentLocation: data.currentLocation,
      pendingLocation: data.pendingLocation,
      isAmbiguous: data.isAmbiguous,
    };
  } catch (err) {
    throw new Error('Batch not found on blockchain: ' + err.message);
  }
};

// ── Format Unix timestamp to human-readable ───────────────────
export const formatTimestamp = (unix) => {
  if (!unix || unix === 0) return '—';
  return new Date(unix * 1000).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Shorten hex address ───────────────────────────────────────
export const shortAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—';

// ── Decode bytes32 role to readable string ────────────────────
export const decodeRole = async (bytes32Role) => {
  const roles = {
    ROLE_CHEMICAL_SUPPLIER: 'Chemical Supplier',
    ROLE_METALLURGY_SUPPLIER: 'Metallurgy Supplier',
    ROLE_MANUFACTURER: 'Manufacturer',
    ROLE_ASSEMBLER: 'Assembler',
    ROLE_QUALITY_CONTROL: 'Quality Control',
    ROLE_AUDITOR: 'Auditor',
    ROLE_INVENTORY: 'Base Inventory',
    ROLE_COMMAND: 'Command',
  };
  try {
    const rbac = await getRbacContract();
    for (const [name, label] of Object.entries(roles)) {
      const hash = await rbac[name]();
      if (hash === bytes32Role) return label;
    }
  } catch (_) {}
  return bytes32Role?.slice(0, 10) + '…';
};
