import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MenuPage from './pages/MenuPage';
import MasterAdmin from './pages/MasterAdmin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
            <Route path="/master" element={<MasterAdmin />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      </BrowserRouter>
    </AuthProvider>
  );
}
