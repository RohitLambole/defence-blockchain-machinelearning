// Renders a colour-coded status pill based on batch state

export default function StatusBadge({ isAmbiguous, pendingLocation, currentLocation }) {
  if (isAmbiguous) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-red-950 text-red-400 border border-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 alert-shake" />
        FROZEN
      </span>
    );
  }
  if (pendingLocation && pendingLocation !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-green" />
        IN TRANSIT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      IN CUSTODY
    </span>
  );
}

// Simple generic badge
export function Tag({ label, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-800 text-gray-300 border-gray-600',
    green: 'bg-emerald-950 text-emerald-400 border-emerald-700',
    red: 'bg-red-950 text-red-400 border-red-700',
    amber: 'bg-amber-950 text-amber-400 border-amber-700',
    blue: 'bg-blue-950 text-blue-400 border-blue-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${colors[color]}`}>
      {label}
    </span>
  );
}
