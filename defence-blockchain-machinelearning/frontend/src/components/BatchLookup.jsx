import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBatchFromChain } from '../services/blockchain';
import { InlineSpinner } from './LoadingSpinner';

// A reusable "Lookup Batch by ID" widget used across dashboards
export default function BatchLookup() {
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!batchId) return;
    setError('');
    setLoading(true);
    try {
      await getBatchFromChain(Number(batchId));
      navigate(`/batch/${batchId}`);
    } catch (err) {
      setError('Batch #' + batchId + ' not found on blockchain.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLookup} className="flex gap-2 items-center">
      <input
        type="number"
        min="1"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
        placeholder="Lookup Batch ID..."
        className="bg-military-700 border border-military-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 w-44 font-mono focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading || !batchId}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-military-600 hover:bg-military-500 border border-military-400 rounded-lg text-slate-200 transition-colors disabled:opacity-50"
      >
        {loading ? <InlineSpinner /> : '🔍'} Search
      </button>
      {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
    </form>
  );
}
