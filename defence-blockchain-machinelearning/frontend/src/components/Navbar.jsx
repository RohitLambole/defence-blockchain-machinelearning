import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { checkHealth } from '../services/api';
import { ROLE_LABELS } from '../config';

const roleBadgeColor = {
  CHEMICAL_SUPPLIER: 'bg-blue-900 text-blue-300 border-blue-700',
  METALLURGY_SUPPLIER: 'bg-indigo-900 text-indigo-300 border-indigo-700',
  MANUFACTURER: 'bg-purple-900 text-purple-300 border-purple-700',
  ASSEMBLER: 'bg-teal-900 text-teal-300 border-teal-700',
  QUALITY_CONTROL: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  AUDITOR: 'bg-amber-900 text-amber-300 border-amber-700',
  INVENTORY: 'bg-cyan-900 text-cyan-300 border-cyan-700',
  COMMAND: 'bg-red-900 text-red-300 border-red-700',
  UNKNOWN: 'bg-gray-800 text-gray-400 border-gray-600',
};

export default function Navbar() {
  const { account, role, disconnect } = useWallet();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth();
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    };
    ping();
    const interval = setInterval(ping, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    disconnect();
    navigate('/');
  };

  const roleLabel = ROLE_LABELS[role] || role || 'Unknown';
  const badgeClass = roleBadgeColor[role] || roleBadgeColor.UNKNOWN;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-military-800 border-b border-military-600 h-14 flex items-center px-6 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-accent text-xl">⬡</span>
        <div>
          <p className="text-xs text-slate-400 font-mono leading-none">DEFENCE</p>
          <p className="text-sm font-semibold text-white leading-none">SUPPLY CHAIN</p>
        </div>
      </div>

      {/* API status */}
      <div className="flex items-center gap-1.5 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            apiOnline === null ? 'bg-gray-500' :
            apiOnline ? 'bg-accent pulse-green' : 'bg-red-500'
          }`}
        />
        <span className="text-slate-400 font-mono">
          {apiOnline === null ? 'CHECKING' : apiOnline ? 'API ONLINE' : 'API OFFLINE'}
        </span>
      </div>

      {/* Role badge */}
      {role && (
        <span className={`text-xs font-mono px-2.5 py-1 rounded border ${badgeClass}`}>
          {roleLabel.toUpperCase()}
        </span>
      )}

      {/* Wallet address */}
      {account && (
        <span className="text-xs font-mono text-slate-400 bg-military-700 px-2.5 py-1 rounded border border-military-500">
          {account.slice(0, 6)}…{account.slice(-4)}
        </span>
      )}

      {/* Logout */}
      {account && (
        <button
          onClick={handleLogout}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors font-mono"
        >
          DISCONNECT
        </button>
      )}
    </nav>
  );
}
