import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { InlineSpinner } from '../components/LoadingSpinner';

const ROLE_ROUTES = {
  CHEMICAL_SUPPLIER: '/dashboard/supplier',
  METALLURGY_SUPPLIER: '/dashboard/supplier',
  MANUFACTURER: '/dashboard/manufacturer',
  ASSEMBLER: '/dashboard/assembler',
  QUALITY_CONTROL: '/dashboard/auditor',
  AUDITOR: '/dashboard/auditor',
  INVENTORY: '/dashboard/manufacturer',
  COMMAND: '/dashboard/command',
};

export default function LoginPage() {
  const { account, role, loading, error, connect } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (account && role && ROLE_ROUTES[role]) {
      navigate(ROLE_ROUTES[role]);
    }
  }, [account, role, navigate]);

  return (
    <div className="min-h-screen bg-military-900 flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-military-700 border border-military-500 mb-4 text-3xl">
            ⬡
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Defence Supply Chain
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">
            BLOCKCHAIN TRACKING SYSTEM v1.0
          </p>
        </div>

        {/* Login card */}
        <div className="bg-military-800 border border-military-600 rounded-2xl p-8 shadow-2xl">
          {/* Classification banner */}
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-2 mb-6 text-center">
            <p className="text-red-400 text-xs font-mono tracking-widest">
              ⚠ CLASSIFIED SYSTEM — AUTHORISED ACCESS ONLY
            </p>
          </div>

          <h2 className="text-lg font-semibold text-white mb-1">Connect Wallet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Connect your MetaMask wallet. Your role will be automatically detected from the RBAC smart contract.
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          {/* Unknown role warning */}
          {account && role === 'UNKNOWN' && (
            <div className="bg-amber-950 border border-amber-700 rounded-lg px-4 py-3 mb-4">
              <p className="text-amber-400 text-sm font-mono">
                ⚠ No role assigned to this wallet. Ask your admin to assign a role via RBAC.sol.
              </p>
            </div>
          )}

          {/* Connect button */}
          {!account ? (
            <button
              onClick={connect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><InlineSpinner /> Connecting…</>
              ) : (
                <><span>🦊</span> Connect MetaMask</>
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <p className="text-accent font-mono text-sm">✓ Connected</p>
              <p className="text-slate-400 font-mono text-xs mt-1">{account}</p>
              {loading && <p className="text-slate-400 text-xs mt-2">Detecting role…</p>}
            </div>
          )}

          {/* Role list */}
          <div className="mt-8 pt-6 border-t border-military-600">
            <p className="text-xs text-slate-500 font-mono mb-3">SYSTEM ROLES</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['Chemical Supplier', 'blue'],
                ['Metallurgy Supplier', 'indigo'],
                ['Manufacturer', 'purple'],
                ['Assembler', 'teal'],
                ['Quality Control', 'yellow'],
                ['Auditor', 'amber'],
                ['Base Inventory', 'cyan'],
                ['Command Officer', 'red'],
              ].map(([label, _]) => (
                <div key={label} className="text-xs text-slate-500 font-mono px-2 py-1 bg-military-700 rounded">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 font-mono mt-6">
          Powered by Polygon · ethers.js · Truffle
        </p>
      </div>
    </div>
  );
}
