import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectRole, shortAddress } from '../services/blockchain';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);    // wallet address
  const [role, setRole]       = useState(null);    // detected RBAC role string
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [networkOk, setNetworkOk] = useState(true);

  // ── Connect MetaMask ──────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it from metamask.io');
      return;
    }
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      setAccount(addr);

      const detectedRole = await detectRole(addr);
      setRole(detectedRole);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────
  const disconnect = () => {
    setAccount(null);
    setRole(null);
  };

  // ── Auto-reconnect if already authorized ─────────────────
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const r = await detectRole(accounts[0]);
        setRole(r);
      }
    });
    // Listen for account changes
    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length === 0) { disconnect(); return; }
      setAccount(accounts[0]);
      const r = await detectRole(accounts[0]);
      setRole(r);
    });
  }, []);

  return (
    <WalletContext.Provider value={{ account, role, loading, error, networkOk, connect, disconnect, shortAddress }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
