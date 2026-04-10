import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { mintBatch, initiateTransfer } from '../services/api';
import { MATERIAL_TYPES, TRANSFER_DESTINATIONS } from '../config';
import StatusBadge, { Tag } from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import BatchLookup from '../components/BatchLookup';
import { InlineSpinner } from '../components/LoadingSpinner';

const emptyForm = {
  batchId: '', supplierName: '', materialType: MATERIAL_TYPES[0],
  weightKg: '', classifiedSpecs: '',
};

export default function SupplierDashboard() {
  const { account, role } = useWallet();
  const [form, setForm]         = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [mintedBatches, setMintedBatches] = useState([]);
  const [toast, setToast]       = useState(null);
  const [transferModal, setTransferModal] = useState(null); // { batchId, nextRole }
  const [transferTarget, setTransferTarget] = useState({ batchId: '', nextRole: 'MANUFACTURER' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const supplierRole = role === 'METALLURGY_SUPPLIER' ? 'METALLURGY_SUPPLIER' : 'CHEMICAL_SUPPLIER';
      const res = await mintBatch({ ...form, batchId: Number(form.batchId), weightKg: Number(form.weightKg), supplierRole });
      const txHash = res.data?.txHash || res.data?.transactionHash || 'N/A';
      setMintedBatches(prev => [
        { ...form, batchId: Number(form.batchId), status: 'IN CUSTODY', txHash, createdAt: new Date().toLocaleString() },
        ...prev,
      ]);
      showToast(`Batch #${form.batchId} minted! TX: ${txHash.slice(0, 16)}…`);
      setForm(emptyForm);
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Mint failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferTarget.batchId || !transferTarget.nextRole) return;
    setTransferModal(null);
    try {
      await initiateTransfer({ batchId: Number(transferTarget.batchId), nextRole: transferTarget.nextRole });
      setMintedBatches(prev =>
        prev.map(b => b.batchId === Number(transferTarget.batchId) ? { ...b, status: 'IN TRANSIT' } : b)
      );
      showToast(`Batch #${transferTarget.batchId} dispatched to ${transferTarget.nextRole}`);
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Transfer failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-military-900 pt-14">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm shadow-xl transition-all
            ${toast.type === 'error' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {role === 'METALLURGY_SUPPLIER' ? 'Metallurgy Supplier' : 'Chemical Supplier'} Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Create raw material batches and dispatch to Manufacturer</p>
          </div>
          <BatchLookup />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Batches Minted', value: mintedBatches.length, color: 'text-accent' },
            { label: 'In Transit', value: mintedBatches.filter(b => b.status === 'IN TRANSIT').length, color: 'text-amber-400' },
            { label: 'In Custody', value: mintedBatches.filter(b => b.status === 'IN CUSTODY').length, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-military-800 border border-military-600 rounded-xl p-5">
              <p className="text-slate-400 text-xs font-mono mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Create Batch Form ── */}
          <div className="bg-military-800 border border-military-600 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-accent">+</span> Create New Batch
            </h2>
            <form onSubmit={handleMint} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">BATCH ID *</label>
                  <input name="batchId" value={form.batchId} onChange={handleChange} required type="number" min="1"
                    placeholder="e.g. 404"
                    className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-mono mb-1">WEIGHT (KG) *</label>
                  <input name="weightKg" value={form.weightKg} onChange={handleChange} required type="number" min="1"
                    placeholder="e.g. 500"
                    className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">SUPPLIER NAME *</label>
                <input name="supplierName" value={form.supplierName} onChange={handleChange} required
                  placeholder="e.g. Alpha Chemicals Ltd."
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent" />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">MATERIAL TYPE *</label>
                <select name="materialType" value={form.materialType} onChange={handleChange}
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white focus:border-accent">
                  {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">CLASSIFIED SPECS *</label>
                <textarea name="classifiedSpecs" value={form.classifiedSpecs} onChange={handleChange} required rows={3}
                  placeholder="e.g. Grade-A RDX, purity 98.5%, batch ref XR-2024"
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent resize-none" />
                <p className="text-xs text-slate-500 font-mono mt-1">This string is hashed off-chain. The hash is stored on Polygon.</p>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60">
                {submitting ? <><InlineSpinner /> Minting on Blockchain…</> : '⬡ Mint Batch on Blockchain'}
              </button>
            </form>
          </div>

          {/* ── Dispatch Panel ── */}
          <div className="bg-military-800 border border-military-600 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-400">→</span> Dispatch Batch
            </h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">BATCH ID</label>
                <input type="number" min="1" value={transferTarget.batchId}
                  onChange={e => setTransferTarget(p => ({ ...p, batchId: e.target.value }))}
                  placeholder="Enter batch ID to dispatch"
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-mono mb-1">DESTINATION ROLE</label>
                <select value={transferTarget.nextRole}
                  onChange={e => setTransferTarget(p => ({ ...p, nextRole: e.target.value }))}
                  className="w-full bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white focus:border-accent">
                  {TRANSFER_DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <button
                onClick={() => setTransferModal(true)}
                disabled={!transferTarget.batchId}
                className="w-full py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                → Initiate Transfer
              </button>
            </div>

            {/* Minted batch list */}
            <div className="mt-4 pt-4 border-t border-military-600">
              <p className="text-xs font-mono text-slate-500 mb-3">THIS SESSION — MINTED BATCHES</p>
              {mintedBatches.length === 0 ? (
                <p className="text-slate-500 text-xs font-mono text-center py-6">No batches minted yet in this session.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {mintedBatches.map(b => (
                    <div key={b.batchId} className="batch-card bg-military-700 border border-military-500 rounded-lg p-3 flex items-center gap-3">
                      <span className="text-accent font-mono text-sm font-bold w-12">#{b.batchId}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{b.supplierName}</p>
                        <p className="text-xs text-slate-400 font-mono truncate">{b.materialType} · {b.weightKg}kg</p>
                      </div>
                      <Tag label={b.status} color={b.status === 'IN TRANSIT' ? 'amber' : 'green'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!transferModal}
        title="Confirm Dispatch"
        message={`Dispatch Batch #${transferTarget.batchId} to ${transferTarget.nextRole}? This action will be recorded on the blockchain.`}
        confirmLabel="Dispatch Batch"
        confirmClass="btn-warning"
        onConfirm={handleTransferSubmit}
        onCancel={() => setTransferModal(null)}
      />
    </div>
  );
}
