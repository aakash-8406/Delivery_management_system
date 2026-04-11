import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, User, LogOut, Package, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    isDark
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark');
  }, [isDark]);

  const linkClass = (path) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 dark:bg-[var(--card)]/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">BiteRush</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>Home</Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className={linkClass('/orders')}>
                <Package size={14} /><span className="hidden sm:inline">My Orders</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-sm">
                <User size={14} className="text-[var(--primary)]" />
                <span className="font-medium text-[var(--foreground)] truncate max-w-24">{user?.name ?? user?.email}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                <LogOut size={14} /><span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className={linkClass('/login')}>
              <User size={14} /><span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
            aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Cart */}
          <Link to="/cart" className={`${linkClass('/cart')} relative`}>
            <ShoppingCart size={16} /><span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
