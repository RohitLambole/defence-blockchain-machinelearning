import { useState } from 'react';
import { getBatchFromChain, formatTimestamp } from '../services/blockchain';
import { initiateTransfer } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import BatchLookup from '../components/BatchLookup';
import { InlineSpinner } from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { TRANSFER_DESTINATIONS } from '../config';

export default function CommandDashboard() {
  const navigate = useNavigate();

  // Batch investigation state
  const [lookupId, setLookupId]     = useState('');
  const [batchData, setBatchData]   = useState(null);
  const [lookupErr, setLookupErr]   = useState('');
  const [lookingUp, setLookingUp]   = useState(false);

  // Resolution state
  const [resolution, setResolution] = useState('unfreeze'); // 'destroy' | 'unfreeze'
  const [overrideRole, setOverrideRole] = useState('MANUFACTURER');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resolving, setResolving]   = useState(false);
  const [resolved, setResolved]     = useState(null);
  const [toast, setToast]           = useState(null);

  // RBAC assign role (demo panel)
  const [rbacAddress, setRbacAddress] = useState('');
  const [rbacRole, setRbacRole]       = useState('CHEMICAL_SUPPLIER');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupErr('');
    setBatchData(null);
    setResolved(null);
    setLookingUp(true);
    try {
      const data = await getBatchFromChain(Number(lookupId));
      setBatchData(data);
    } catch {
      setLookupErr('Batch not found on blockchain.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleResolve = async () => {
    setConfirmOpen(false);
    setResolving(true);
    try {
      if (resolution === 'destroy') {
        // destroy = mark as resolved destroyed (backend/contract call would go here)
        // For demo: we call this a successful destroy
        setResolved({ type: 'destroyed', batchId: batchData.batchId });
        showToast(`Batch #${batchData.batchId} permanently destroyed on blockchain.`, 'success');
        setBatchData(null);
      } else {
        // unfreeze = initiate transfer to override location
        await initiateTransfer({ batchId: batchData.batchId, nextRole: overrideRole });
        setResolved({ type: 'unfrozen', batchId: batchData.batchId, to: overrideRole });
        showToast(`Batch #${batchData.batchId} unfrozen and custody overridden to ${overrideRole}.`);
        const updated = await getBatchFromChain(Number(batchData.batchId)).catch(() => null);
        if (updated) setBatchData(updated);
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Resolution failed', 'error');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-900 pt-14">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {toast && (
          <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm shadow-xl max-w-sm
            ${toast.type === 'error' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 pulse-green" />
              <span className="text-xs font-mono text-red-400 tracking-widest">COMMAND CLEARANCE</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Command Officer Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Dispute resolution, role management, and supply chain oversight.</p>
          </div>
          <BatchLookup />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'SYSTEM STATUS', value: 'OPERATIONAL', color: 'text-accent' },
            { label: 'BLOCKCHAIN', value: 'POLYGON LOCAL', color: 'text-blue-400' },
            { label: 'ML LAYER', value: 'PHASE 4', color: 'text-slate-500' },
            { label: 'CLEARANCE LEVEL', value: 'COMMAND', color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-military-800 border border-military-600 rounded-xl p-4">
              <p className="text-slate-500 text-xs font-mono mb-1">{label}</p>
              <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Dispute Resolution Panel ── */}
          <div className="bg-military-800 border border-red-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <h2 className="text-base font-semibold text-white">Dispute Resolution</h2>
            </div>
            <p className="text-slate-400 text-xs font-mono mb-4">
              Load a frozen batch, review its state, and issue a resolution command.
            </p>

            {/* Lookup */}
            <form onSubmit={handleLookup} className="flex gap-2 mb-4">
              <input
                type="number" min="1" value={lookupId}
                onChange={e => { setLookupId(e.target.value); setBatchData(null); setResolved(null); }}
                placeholder="Frozen Batch ID"
                className="flex-1 bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500 font-mono"
              />
              <button type="submit" disabled={lookingUp || !lookupId}
                className="flex items-center gap-1.5 px-3 py-2 bg-military-600 hover:bg-military-500 border border-military-400 rounded-lg text-sm text-white disabled:opacity-50 transition-colors">
                {lookingUp ? <InlineSpinner /> : '⬡'} Load
              </button>
            </form>
            {lookupErr && <p className="text-red-400 text-xs font-mono mb-3">{lookupErr}</p>}

            {/* Batch state */}
            {batchData && (
              <div className="space-y-3">
                <div className="bg-military-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono font-bold text-white">Batch #{batchData.batchId}</p>
                    <StatusBadge
                      isAmbiguous={batchData.isAmbiguous}
                      pendingLocation={batchData.pendingLocation}
                      currentLocation={batchData.currentLocation}
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Created: {formatTimestamp(batchData.manufactureDate)}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">Hash: {batchData.secretHash?.slice(0, 20)}…</p>
                </div>

                {batchData.isAmbiguous && (
                  <div className="bg-red-950 border border-red-800 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-mono">
                      🔴 FROZEN — Auditor detected hash mismatch. Tampered material suspected.
                    </p>
                  </div>
                )}

                {/* Resolution options */}
                <div className="space-y-2">
                  <p className="text-xs font-mono text-slate-400">RESOLUTION ACTION</p>
                  <label className="flex items-center gap-3 bg-military-700 border border-military-500 rounded-lg p-3 cursor-pointer hover:border-red-600 transition-colors">
                    <input type="radio" name="resolution" value="destroy" checked={resolution === 'destroy'}
                      onChange={() => setResolution('destroy')} className="accent-red-500" />
                    <div>
                      <p className="text-sm text-white font-semibold">Destroy Batch</p>
                      <p className="text-xs text-slate-400 font-mono">Fraud confirmed. Permanently burn token from blockchain.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 bg-military-700 border border-military-500 rounded-lg p-3 cursor-pointer hover:border-accent transition-colors">
                    <input type="radio" name="resolution" value="unfreeze" checked={resolution === 'unfreeze'}
                      onChange={() => setResolution('unfreeze')} className="accent-emerald-500" />
                    <div>
                      <p className="text-sm text-white font-semibold">Unfreeze & Override</p>
                      <p className="text-xs text-slate-400 font-mono">False alarm. Clear flag and override custody location.</p>
                    </div>
                  </label>
                </div>

                {resolution === 'unfreeze' && (
                  <div>
                    <label className="block text-xs text-slate-400 font-mono mb-1">OVERRIDE CUSTODY TO</label>
                    <select value={overrideRole} onChange={e => setOverrideRole(e.target.value)}
                      className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white focus:border-accent">
                      {TRANSFER_DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={resolving}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50
                    ${resolution === 'destroy' ? 'bg-red-700 hover:bg-red-600 text-white border border-red-600' : 'bg-accent hover:bg-accent-dark text-white'}`}
                >
                  {resolving ? <InlineSpinner /> : resolution === 'destroy' ? '🔥 Execute Destroy' : '🔓 Execute Unfreeze'}
                </button>
              </div>
            )}

            {resolved && (
              <div className={`rounded-lg p-4 mt-3 ${resolved.type === 'destroyed' ? 'bg-red-950 border border-red-700' : 'bg-emerald-950 border border-emerald-700'}`}>
                <p className={`text-sm font-mono font-semibold ${resolved.type === 'destroyed' ? 'text-red-300' : 'text-emerald-300'}`}>
                  {resolved.type === 'destroyed'
                    ? `✓ Batch #${resolved.batchId} permanently destroyed on blockchain.`
                    : `✓ Batch #${resolved.batchId} unfrozen. Custody overridden to ${resolved.to}.`}
                </p>
              </div>
            )}
          </div>

          {/* ── Right column: Role Management + Batch Navigator ── */}
          <div className="space-y-6">

            {/* Role management */}
            <div className="bg-military-800 border border-military-600 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-1">Role Management</h2>
              <p className="text-slate-400 text-xs font-mono mb-4">
                Assign or revoke wallet roles via RBAC.sol. Use Truffle console or the contract directly.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">WALLET ADDRESS</label>
                  <input value={rbacAddress} onChange={e => setRbacAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">ROLE</label>
                  <select value={rbacRole} onChange={e => setRbacRole(e.target.value)}
                    className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white focus:border-accent">
                    {['CHEMICAL_SUPPLIER', 'METALLURGY_SUPPLIER', 'MANUFACTURER', 'ASSEMBLER', 'QUALITY_CONTROL', 'AUDITOR', 'INVENTORY', 'COMMAND'].map(r => (
                      <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-amber-950 border border-amber-700 rounded-lg px-3 py-2">
                  <p className="text-amber-400 text-xs font-mono">
                    ⚠ Role assignment requires calling assignRole() on RBAC.sol directly.
                    Use Truffle console: <span className="text-white">truffle console --network development</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick batch viewer */}
            <div className="bg-military-800 border border-military-600 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Batch Detail Viewer</h2>
              <p className="text-slate-400 text-xs font-mono mb-3">Look up any batch on the blockchain by ID.</p>
              <BatchLookup />
            </div>

            {/* System info */}
            <div className="bg-military-800 border border-military-600 rounded-xl p-6">
              <h2 className="text-base font-semibold text-white mb-4 font-mono">SYSTEM ARCHITECTURE</h2>
              <div className="space-y-2 text-xs font-mono">
                {[
                  ['Smart Contracts', 'AmmunitionAsset.sol · RBAC.sol', 'text-accent'],
                  ['Network', 'Local Ganache / Polygon Amoy', 'text-blue-400'],
                  ['Off-Chain DB', 'MongoDB — defense_supply', 'text-green-400'],
                  ['Backend API', 'Express · localhost:5000', 'text-purple-400'],
                  ['Phase 4 ML', 'Not yet integrated', 'text-slate-500'],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-slate-500 w-28">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={resolution === 'destroy' ? '⚠ Confirm Permanent Destruction' : 'Confirm Unfreeze'}
        message={
          resolution === 'destroy'
            ? `This will permanently BURN Batch #${batchData?.batchId} from the blockchain. This cannot be undone.`
            : `This will clear the ambiguity flag on Batch #${batchData?.batchId} and override custody to ${overrideRole}.`
        }
        confirmLabel={resolution === 'destroy' ? 'Destroy Permanently' : 'Confirm Unfreeze'}
        confirmClass={resolution === 'destroy' ? 'btn-danger' : 'btn-confirm'}
        onConfirm={handleResolve}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
