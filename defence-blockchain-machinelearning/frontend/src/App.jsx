import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWallet, WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SupplierDashboard from './pages/SupplierDashboard';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import AuditorPanel from './pages/AuditorPanel';
import CommandDashboard from './pages/CommandDashboard';
import BatchDetailPage from './pages/BatchDetailPage';

// Protected route — redirects to login if wallet not connected
function Protected({ children, allowedRoles }) {
  const { account, role } = useWallet();
  if (!account) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-military-900 pt-14 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-3">🚫</p>
          <p className="text-red-400 font-mono text-sm">ACCESS DENIED</p>
          <p className="text-slate-400 text-xs font-mono mt-1">
            Your role ({role}) does not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

function AppLayout() {
  const { account } = useWallet();
  return (
    <>
      {account && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<LoginPage />} />

        {/* Supplier (Chemical + Metallurgy) */}
        <Route path="/dashboard/supplier" element={
          <Protected allowedRoles={['CHEMICAL_SUPPLIER', 'METALLURGY_SUPPLIER']}>
            <SupplierDashboard />
          </Protected>
        } />

        {/* Manufacturer / Assembler / Inventory */}
        <Route path="/dashboard/manufacturer" element={
          <Protected allowedRoles={['MANUFACTURER', 'ASSEMBLER', 'INVENTORY']}>
            <ManufacturerDashboard />
          </Protected>
        } />

        {/* Assembler uses same dashboard as manufacturer */}
        <Route path="/dashboard/assembler" element={
          <Protected allowedRoles={['ASSEMBLER', 'MANUFACTURER', 'INVENTORY']}>
            <ManufacturerDashboard />
          </Protected>
        } />

        {/* Auditor / Quality Control */}
        <Route path="/dashboard/auditor" element={
          <Protected allowedRoles={['AUDITOR', 'QUALITY_CONTROL']}>
            <AuditorPanel />
          </Protected>
        } />

        {/* Command */}
        <Route path="/dashboard/command" element={
          <Protected allowedRoles={['COMMAND']}>
            <CommandDashboard />
          </Protected>
        } />

        {/* Batch detail — accessible by all authenticated roles */}
        <Route path="/batch/:id" element={
          <Protected>
            <BatchDetailPage />
          </Protected>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </WalletProvider>
  );
}
