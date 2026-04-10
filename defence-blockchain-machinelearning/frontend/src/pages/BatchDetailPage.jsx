import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBatchFromChain, formatTimestamp, getAmmoContract } from '../services/blockchain';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const SUPPLY_CHAIN_NODES = [
  { role: 'CHEMICAL_SUPPLIER',    label: 'Chemical Supplier',    icon: '🧪' },
  { role: 'METALLURGY_SUPPLIER',  label: 'Metallurgy Supplier',  icon: '⚙️' },
  { role: 'MANUFACTURER',         label: 'Manufacturer',         icon: '🏭' },
  { role: 'ASSEMBLER',            label: 'Assembler',            icon: '🔧' },
  { role: 'QUALITY_CONTROL',      label: 'Quality Control',      icon: '🔍' },
  { role: 'INVENTORY',            label: 'Base Inventory',       icon: '📦' },
  { role: 'COMMAND',              label: 'Command',              icon: '🎖️' },
];

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [timestamps, setTimestamps] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBatchFromChain(Number(id));
        setBatch(data);
        // Try to load nodeTimestamps for each role
        try {
          const contract = await getAmmoContract();
          const tsMap = {};
          for (const node of SUPPLY_CHAIN_NODES) {
            // We need the bytes32 role hash — for now use contract constant
            // This will only work if the contract is deployed
            const ts = await contract.nodeTimestamps(Number(id), data.currentLocation).catch(() => 0n);
            tsMap[node.role] = Number(ts);
          }
          setTimestamps(tsMap);
        } catch (_) {}
      } catch (err) {
        setError('Batch #' + id + ' not found on blockchain. ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-military-900 pt-14 flex items-center justify-center">
      <LoadingSpinner message="Reading from blockchain…" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-military-900 pt-14 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 font-mono mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Go Back
        </button>
      </div>
    </div>
  );

  const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const hasPending = batch?.pendingLocation && batch.pendingLocation !== ZERO;

  return (
    <div className="min-h-screen bg-military-900 pt-14">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="text-sm text-slate-400 hover:text-white font-mono mb-6 flex items-center gap-1 transition-colors">
          ← Back
        </button>

        {/* Header card */}
        <div className="bg-military-800 border border-military-600 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 font-mono mb-1">AMMUNITION BATCH</p>
              <h1 className="text-4xl font-bold text-white font-mono">#{batch.batchId}</h1>
            </div>
            <StatusBadge
              isAmbiguous={batch.isAmbiguous}
              pendingLocation={batch.pendingLocation}
              currentLocation={batch.currentLocation}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'CREATED AT', value: formatTimestamp(batch.manufactureDate) },
              { label: 'TRANSFER PENDING', value: hasPending ? 'Yes' : 'No' },
              { label: 'AMBIGUITY FLAG', value: batch.isAmbiguous ? 'FROZEN 🔒' : 'Clear ✓' },
              { label: 'BATCH ID (on-chain)', value: `#${batch.batchId}`, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="bg-military-700 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-mono mb-1">{label}</p>
                <p className={`text-sm font-semibold text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Frozen alert */}
        {batch.isAmbiguous && (
          <div className="bg-red-950 border border-red-700 rounded-xl p-4 mb-6 alert-shake">
            <p className="text-red-400 font-mono text-sm">
              🔒 BATCH FROZEN — Auditor detected a hash mismatch. This batch is under investigation.
              Only ROLE_COMMAND can resolve this ambiguity (destroy or unfreeze).
            </p>
          </div>
        )}

        {/* In-transit alert */}
        {hasPending && !batch.isAmbiguous && (
          <div className="bg-amber-950 border border-amber-700 rounded-xl p-4 mb-6">
            <p className="text-amber-400 font-mono text-sm">
              🚛 IN TRANSIT — Batch has been dispatched and is awaiting Auditor verification at the destination node.
            </p>
          </div>
        )}

        {/* Supply chain timeline */}
        <div className="bg-military-800 border border-military-600 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white font-mono mb-6">SUPPLY CHAIN TIMELINE</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-military-600" />
            <div className="space-y-4">
              {SUPPLY_CHAIN_NODES.map((node, idx) => {
                const hasTimestamp = timestamps[node.role] && timestamps[node.role] > 0;
                const isActive = batch.currentLocation?.includes(node.role.slice(0, 6));
                return (
                  <div key={node.role} className="flex items-center gap-4 pl-2">
                    <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs
                      ${hasTimestamp || isActive
                        ? 'bg-accent border-accent text-white'
                        : 'bg-military-800 border-military-500 text-slate-500'
                      }`}>
                      {hasTimestamp ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 bg-military-700 rounded-lg p-3 flex items-center gap-3">
                      <span className="text-lg">{node.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${hasTimestamp || isActive ? 'text-white' : 'text-slate-500'}`}>
                          {node.label}
                        </p>
                        {hasTimestamp ? (
                          <p className="text-xs font-mono text-slate-400">{formatTimestamp(timestamps[node.role])}</p>
                        ) : (
                          <p className="text-xs font-mono text-slate-600">Not yet reached</p>
                        )}
                      </div>
                      {isActive && !batch.isAmbiguous && (
                        <span className="text-xs font-mono text-accent bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cryptographic data */}
        <div className="bg-military-800 border border-military-600 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-white font-mono mb-4">CRYPTOGRAPHIC AUDIT DATA</h2>
          <div className="space-y-3">
            {[
              { label: 'SECRET HASH (on-chain)', value: batch.secretHash },
              { label: 'CURRENT LOCATION (bytes32 role)', value: batch.currentLocation },
              { label: 'PENDING LOCATION (bytes32 role)', value: hasPending ? batch.pendingLocation : '— (no active transfer)' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-military-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 font-mono mb-1">{label}</p>
                <p className="text-xs text-white font-mono break-all">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-military-700 border border-military-500 rounded-lg p-3">
            <p className="text-xs text-slate-500 font-mono">
              ⚠ Classified physical specs (weight, chemical formula, supplier name) are stored off-chain in MongoDB.
              Only the cryptographic hash is visible on the blockchain to protect sensitive information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
