import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { initiateTransfer } from '../services/api';
import { getBatchFromChain, formatTimestamp } from '../services/blockchain';
import { TRANSFER_DESTINATIONS } from '../config';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import BatchLookup from '../components/BatchLookup';
import { InlineSpinner } from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function ManufacturerDashboard() {
  const { role } = useWallet();
  const navigate = useNavigate();
  const roleLabel = role === 'ASSEMBLER' ? 'Assembler' : role === 'INVENTORY' ? 'Base Inventory' : 'Manufacturer';

  const [lookupId, setLookupId]     = useState('');
  const [batchData, setBatchData]   = useState(null);
  const [lookupErr, setLookupErr]   = useState('');
  const [lookingUp, setLookingUp]   = useState(false);

  const [nextRole, setNextRole]     = useState('ASSEMBLER');
  const [dispatching, setDispatching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupErr('');
    setBatchData(null);
    setLookingUp(true);
    try {
      const data = await getBatchFromChain(Number(lookupId));
      setBatchData(data);
    } catch (err) {
      setLookupErr('Batch not found on blockchain.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleDispatch = async () => {
    setConfirmOpen(false);
    setDispatching(true);
    try {
      await initiateTransfer({ batchId: batchData.batchId, nextRole });
      showToast(`Batch #${batchData.batchId} dispatched to ${nextRole}`);
      setBatchData(prev => ({ ...prev, pendingLocation: '0xactive' }));
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Dispatch failed', 'error');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-900 pt-14">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {toast && (
          <div className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-lg border font-mono text-sm shadow-xl
            ${toast.type === 'error' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{roleLabel} Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Receive incoming batches and dispatch them to the next stage in the supply chain.
            </p>
          </div>
          <BatchLookup />
        </div>

        {/* Lookup */}
        <div className="bg-military-800 border border-military-600 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4 font-mono">🔍 LOAD BATCH FROM BLOCKCHAIN</h2>
          <form onSubmit={handleLookup} className="flex gap-3 items-center mb-4">
            <input
              type="number" min="1" value={lookupId}
              onChange={e => setLookupId(e.target.value)}
              placeholder="Enter Batch ID (e.g. 404)"
              className="flex-1 max-w-xs bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-accent font-mono"
            />
            <button type="submit" disabled={lookingUp || !lookupId}
              className="flex items-center gap-2 px-4 py-2 bg-military-600 hover:bg-military-500 border border-military-400 rounded-lg text-sm text-white transition-colors disabled:opacity-50">
              {lookingUp ? <InlineSpinner /> : '⬡'} Load Batch
            </button>
          </form>
          {lookupErr && <p className="text-red-400 text-xs font-mono">{lookupErr}</p>}
        </div>

        {/* Batch detail card */}
        {batchData && (
          <div className="bg-military-800 border border-military-600 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-slate-400 font-mono mb-1">BATCH ID</p>
                <p className="text-3xl font-bold text-white font-mono">#{batchData.batchId}</p>
              </div>
              <StatusBadge
                isAmbiguous={batchData.isAmbiguous}
                pendingLocation={batchData.pendingLocation}
                currentLocation={batchData.currentLocation}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'MANUFACTURED', value: formatTimestamp(batchData.manufactureDate) },
                { label: 'SECRET HASH', value: batchData.secretHash?.slice(0, 18) + '…', mono: true },
                { label: 'CURRENT LOCATION', value: batchData.currentLocation?.slice(0, 18) + '…', mono: true },
                { label: 'AMBIGUITY FLAG', value: batchData.isAmbiguous ? '🔴 FLAGGED' : '🟢 CLEAR' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="bg-military-700 rounded-lg p-3">
                  <p className="text-xs text-slate-400 font-mono mb-1">{label}</p>
                  <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Dispatch section */}
            {!batchData.isAmbiguous && (
              <div className="border-t border-military-600 pt-4">
                <p className="text-xs font-mono text-slate-400 mb-3">DISPATCH TO NEXT NODE</p>
                <div className="flex gap-3 items-center">
                  <select
                    value={nextRole}
                    onChange={e => setNextRole(e.target.value)}
                    className="flex-1 max-w-xs bg-military-700 border border-military-500 rounded-lg px-3 py-2 text-sm text-white focus:border-accent"
                  >
                    {TRANSFER_DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={dispatching}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {dispatching ? <InlineSpinner /> : '→'} Dispatch Batch
                  </button>
                  <button
                    onClick={() => navigate(`/batch/${batchData.batchId}`)}
                    className="px-4 py-2 text-sm border border-military-400 text-slate-300 rounded-lg hover:bg-military-700 transition-colors"
                  >
                    View Detail
                  </button>
                </div>
                {batchData.isAmbiguous && (
                  <p className="text-red-400 text-xs font-mono mt-2">
                    ⚠ Batch is frozen. Cannot dispatch until Command resolves ambiguity.
                  </p>
                )}
              </div>
            )}

            {batchData.isAmbiguous && (
              <div className="mt-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm font-mono">
                  🔒 BATCH FROZEN — This batch has been flagged as tampered. Awaiting Command resolution.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!batchData && (
          <div className="bg-military-800 border border-dashed border-military-500 rounded-xl p-8 text-center">
            <p className="text-3xl mb-3">⬡</p>
            <p className="text-slate-400 text-sm">Enter a Batch ID above to load it from the blockchain.</p>
            <p className="text-slate-500 text-xs font-mono mt-1">Batch data is read directly from Polygon smart contract.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm Dispatch"
        message={`Dispatch Batch #${batchData?.batchId} to ${nextRole}? This will be recorded on the Polygon blockchain.`}
        confirmLabel="Dispatch"
        confirmClass="btn-warning"
        onConfirm={handleDispatch}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
