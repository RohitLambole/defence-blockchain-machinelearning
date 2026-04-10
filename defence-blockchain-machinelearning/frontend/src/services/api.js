import axios from 'axios';
import { CONFIG } from '../config';

const api = axios.create({
  baseURL: CONFIG.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Health ──────────────────────────────────────────────────
export const checkHealth = () => api.get('/api/health');

// ── Mint a new batch ─────────────────────────────────────────
// Called by: Chemical Supplier / Metallurgy Supplier
export const mintBatch = (payload) => api.post('/api/chain/mint', payload);
// payload: { batchId, supplierName, materialType, weightKg, classifiedSpecs, supplierRole }

// ── Initiate transfer ────────────────────────────────────────
// Called by: any role that currently holds a batch
export const initiateTransfer = (payload) => api.post('/api/chain/transfer', payload);
// payload: { batchId, nextRole }

// ── Auditor verification ─────────────────────────────────────
// Called by: Auditor / Quality Control
export const auditBatch = (payload) => api.post('/api/chain/audit', payload);
// payload: { batchId, scannedSecretString }
