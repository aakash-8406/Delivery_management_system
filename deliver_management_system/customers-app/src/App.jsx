import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu/:id" element={<Menu />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" autoClose={3000} theme="light" />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);
export default App;
