import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { RestaurantAuthProvider } from './context/RestaurantAuthContext';
import { CartProvider } from './context/CartContext';

// Shared
import Navbar from './components/shared/Navbar';

// Customer pages
import Home     from './pages/customer/Home';
import Login    from './pages/customer/Login';
import Menu     from './pages/customer/Menu';
import Cart     from './pages/customer/Cart';
import MyOrders from './pages/customer/MyOrders';

// Restaurant pages
import RestaurantLoginPage from './pages/restaurant/LoginPage';
import Dashboard           from './pages/restaurant/Dashboard';
import MenuPage            from './pages/restaurant/MenuPage';
import MasterAdmin         from './pages/restaurant/MasterAdmin';
import RestaurantProtectedRoute from './components/restaurant/ProtectedRoute';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <p className="text-6xl">404</p>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Page not found</h1>
      <p className="text-[var(--muted-foreground)]">The page you're looking for doesn't exist.</p>
      <a href="/" className="mt-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all">
        Go Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <CustomerAuthProvider>
      <RestaurantAuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
              <Navbar />
              <Routes>
                {/* ── Customer routes ── */}
                <Route path="/"        element={<Home />} />
                <Route path="/login"   element={<Login />} />
                <Route path="/menu/:id" element={<Menu />} />
                <Route path="/cart"    element={<Cart />} />
                <Route path="/orders"  element={<MyOrders />} />

                {/* ── Restaurant routes ── */}
                <Route path="/restaurant" element={<Navigate to="/restaurant/login" replace />} />
                <Route path="/restaurant/login" element={<RestaurantLoginPage />} />
                <Route path="/restaurant/dashboard" element={
                  <RestaurantProtectedRoute><Dashboard /></RestaurantProtectedRoute>
                } />
                <Route path="/restaurant/menu" element={
                  <RestaurantProtectedRoute><MenuPage /></RestaurantProtectedRoute>
                } />
                <Route path="/restaurant/master" element={<MasterAdmin />} />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
          </BrowserRouter>
        </CartProvider>
      </RestaurantAuthProvider>
    </CustomerAuthProvider>
  );
}
