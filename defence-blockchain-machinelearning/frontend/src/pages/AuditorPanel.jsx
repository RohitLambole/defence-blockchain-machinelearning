import { useState } from 'react';
import { auditBatch } from '../services/api';
import { getBatchFromChain, formatTimestamp } from '../services/blockchain';
import StatusBadge from '../components/StatusBadge';
import BatchLookup from '../components/BatchLookup';
import ConfirmModal from '../components/ConfirmModal';
import { InlineSpinner } from '../components/LoadingSpinner';

export default function AuditorPanel() {
  const [batchId, setBatchId]         = useState('');
  const [batchData, setBatchData]     = useState(null);
  const [lookupErr, setLookupErr]     = useState('');
  const [lookingUp, setLookingUp]     = useState(false);

  const [scannedHash, setScannedHash] = useState('');
  const [verifying, setVerifying]     = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // { success: bool, txHash: string }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLoadBatch = async (e) => {
    e.preventDefault();
    setLookupErr('');
    setBatchData(null);
    setVerifyResult(null);
    setLookingUp(true);
    try {
      const data = await getBatchFromChain(Number(batchId));
      setBatchData(data);
    } catch {
      setLookupErr('Batch not found on blockchain.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleVerify = async () => {
    setConfirmOpen(false);
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await auditBatch({ batchId: Number(batchId), scannedSecretString: scannedHash });
      const txHash = res.data?.txHash || res.data?.transactionHash || 'N/A';
      setVerifyResult({ success: true, txHash });
      showToast(`✓ Verification passed. Transfer approved. TX: ${txHash.slice(0, 16)}…`);
      // Reload batch state
      const updated = await getBatchFromChain(Number(batchId));
      setBatchData(updated);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Verification failed';
      // Treat hash mismatch as a known outcome (not a system error)
      if (message.toLowerCase().includes('ambig') || message.toLowerCase().includes('mismatch') || message.toLowerCase().includes('flagged')) {
        setVerifyResult({ success: false, txHash: 'N/A' });
        showToast('🚨 HASH MISMATCH — Batch frozen. Command has been alerted.', 'error');
        const updated = await getBatchFromChain(Number(batchId)).catch(() => null);
        if (updated) setBatchData(updated);
      } else {
        showToast(message, 'error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const hasPending = batchData?.pendingLocation && batchData.pendingLocation !== ZERO_BYTES32;

  return (
    <div className="min-h-screen bg-military-900 pt-14">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {toast && (
          <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm shadow-xl max-w-sm
            ${toast.type === 'error' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Auditor / Quality Control Panel</h1>
            <p className="text-slate-400 text-sm mt-1">
              Physically scan a batch and submit its hash to verify supply chain integrity.
            </p>
          </div>
          <BatchLookup />
        </div>

        {/* How it works banner */}
        <div className="bg-military-800 border border-military-600 rounded-xl p-4 mb-6">
          <p className="text-xs font-mono text-slate-400 mb-2">HOW AUDITING WORKS</p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-accent font-mono">1</span>
            <span>Load a batch by ID</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-accent font-mono">2</span>
            <span>Physically scan the crate with your offline tool</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-accent font-mono">3</span>
            <span>Paste the generated string below</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-accent font-mono">4</span>
            <span>Submit — blockchain verifies the hash</span>
          </div>
        </div>

        {/* Load batch */}
        <div className="bg-military-800 border border-military-600 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4 font-mono">STEP 1 — LOAD BATCH</h2>
          <form onSubmit={handleLoadBatch} className="flex gap-3 items-center">
            <input
              type="number" min="1" value={batchId}
              onChange={e => { setBatchId(e.target.value); setBatchData(null); setVerifyResult(null); }}
              placeholder="Enter Batch ID"
              className="flex-1 max-w-xs bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono"
            />
            <button type="submit" disabled={lookingUp || !batchId}
              className="flex items-center gap-2 px-4 py-2 bg-military-600 hover:bg-military-500 border border-military-400 rounded-lg text-sm text-white transition-colors disabled:opacity-50">
              {lookingUp ? <InlineSpinner /> : '⬡'} Load from Chain
            </button>
          </form>
          {lookupErr && <p className="text-red-400 text-xs font-mono mt-2">{lookupErr}</p>}
        </div>

        {/* Batch info */}
        {batchData && (
          <div className="bg-military-800 border border-military-600 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white font-mono">BATCH #{batchData.batchId} — STATUS</p>
              <StatusBadge
                isAmbiguous={batchData.isAmbiguous}
                pendingLocation={batchData.pendingLocation}
                currentLocation={batchData.currentLocation}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'CREATED AT', value: formatTimestamp(batchData.manufactureDate) },
                { label: 'PENDING TRANSFER', value: hasPending ? 'YES — Awaiting Audit' : 'No active transfer' },
                { label: 'AMBIGUITY FLAG', value: batchData.isAmbiguous ? '🔴 FROZEN' : '🟢 Clear' },
                { label: 'ON-CHAIN HASH', value: batchData.secretHash?.slice(0, 24) + '…', mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="bg-military-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-mono mb-1">{label}</p>
                  <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {batchData.isAmbiguous && (
              <div className="mt-4 bg-red-950 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm font-mono">🔒 This batch is already FROZEN. No further verification possible.</p>
              </div>
            )}
          </div>
        )}

        {/* Verify form */}
        {batchData && !batchData.isAmbiguous && (
          <div className="bg-military-800 border border-military-600 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4 font-mono">STEP 2 — SUBMIT PHYSICAL SCAN</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">
                  SCANNED SECRET STRING (from offline scanner)
                </label>
                <textarea
                  value={scannedHash}
                  onChange={e => setScannedHash(e.target.value)}
                  rows={3}
                  placeholder="Paste the exact string generated by your offline scanner tool..."
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono resize-none"
                />
                <p className="text-xs text-slate-500 font-mono mt-1">
                  The backend will hash this string and compare it against the on-chain hash.
                </p>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!scannedHash || verifying}
                className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {verifying ? <InlineSpinner /> : '🔐'} Submit Verification
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {verifyResult && (
          <div className={`rounded-xl p-6 border ${
            verifyResult.success
              ? 'bg-emerald-950 border-emerald-700'
              : 'bg-red-950 border-red-700 alert-shake'
          }`}>
            <p className="text-lg font-bold mb-2">
              {verifyResult.success ? '✅ VERIFICATION PASSED' : '🚨 TAMPERING DETECTED'}
            </p>
            <p className={`text-sm font-mono ${verifyResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
              {verifyResult.success
                ? `Transfer approved. Custody updated on Polygon. TX: ${verifyResult.txHash}`
                : 'Hash mismatch confirmed. Batch has been FROZEN on the blockchain. ROLE_COMMAND has been alerted for Dispute Resolution.'}
            </p>
          </div>
        )}

        {/* No pending warning */}
        {batchData && !hasPending && !batchData.isAmbiguous && (
          <div className="bg-amber-950 border border-amber-700 rounded-xl p-4">
            <p className="text-amber-400 text-sm font-mono">
              ⚠ No active transfer pending for Batch #{batchData.batchId}. A transfer must be initiated first before auditing.
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Submit Audit Verification"
        message="Submit the scanned hash to the blockchain for verification. This action is irreversible and will either approve the transfer or freeze the batch."
        confirmLabel="Submit Verification"
        confirmClass="btn-confirm"
        onConfirm={handleVerify}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
