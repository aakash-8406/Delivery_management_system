import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  ShoppingCart, UtensilsCrossed, User, LogOut, Package,
  Moon, Sun, LayoutDashboard, BookOpen, Store, ChevronDown,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useRestaurantAuth } from '../../context/RestaurantAuthContext';

export default function Navbar() {
  const { totalItems }                       = useCart();
  const { user: customer, isAuthenticated, logout: customerLogout } = useCustomerAuth();
  const { user: restaurant, logout: restaurantLogout }              = useRestaurantAuth();
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  const isRestaurantSection = pathname.startsWith('/restaurant');

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [portalOpen, setPortalOpen] = useState(false);
  const portalRef = useRef(null);

  useEffect(() => {
    isDark
      ? document.documentElement.classList.add('dark')
      : document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Close portal dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (portalRef.current && !portalRef.current.contains(e.target)) setPortalOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkCls = (path) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 dark:bg-[var(--card)]/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">BiteRush</span>
          {isRestaurantSection && (
            <span className="hidden sm:inline text-xs font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full ml-1">
              Restaurant
            </span>
          )}
        </Link>

        {/* ── Nav links ── */}
        <div className="flex items-center gap-1">

          {/* ── CUSTOMER section links ── */}
          {!isRestaurantSection && (
            <>
              <Link to="/" className={linkCls('/')}>Home</Link>

              {isAuthenticated ? (
                <>
                  <Link to="/orders" className={linkCls('/orders')}>
                    <Package size={14} /><span className="hidden sm:inline">My Orders</span>
                  </Link>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-sm">
                    <User size={14} className="text-[var(--primary)]" />
                    <span className="font-medium truncate max-w-24">{customer?.name ?? customer?.email}</span>
                  </div>
                  <button
                    onClick={() => { customerLogout(); navigate('/'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} /><span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className={linkCls('/login')}>
                  <User size={14} /><span className="hidden sm:inline">Login</span>
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className={`${linkCls('/cart')} relative`}>
                <ShoppingCart size={16} /><span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* ── RESTAURANT section links ── */}
          {isRestaurantSection && restaurant && (
            <>
              <NavLink to="/restaurant/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}>
                <LayoutDashboard size={14} /><span className="hidden sm:inline">Orders</span>
              </NavLink>
              <NavLink to="/restaurant/menu"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}>
                <BookOpen size={14} /><span className="hidden sm:inline">Menu</span>
              </NavLink>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-sm">
                <Store size={14} className="text-[var(--primary)]" />
                <span className="font-medium">{restaurant?.name ?? restaurant?.restaurantId}</span>
              </div>
              <button
                onClick={() => { restaurantLogout(); navigate('/restaurant/login'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                <LogOut size={15} /><span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}

          {/* ── Portal switcher ── */}
          <div className="relative ml-1" ref={portalRef}>
            <button
              onClick={() => setPortalOpen(!portalOpen)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]">
              {isRestaurantSection ? 'Restaurant' : 'Customer'}
              <ChevronDown size={13} className={`transition-transform ${portalOpen ? 'rotate-180' : ''}`} />
            </button>
            {portalOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50">
                <Link
                  to="/"
                  onClick={() => setPortalOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--muted)] transition-colors ${!isRestaurantSection ? 'text-[var(--primary)] font-semibold' : 'text-[var(--foreground)]'}`}>
                  <ShoppingCart size={15} /> Customer App
                </Link>
                <Link
                  to="/restaurant/login"
                  onClick={() => setPortalOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--muted)] transition-colors border-t border-[var(--border)] ${isRestaurantSection ? 'text-[var(--primary)] font-semibold' : 'text-[var(--foreground)]'}`}>
                  <Store size={15} /> Restaurant Portal
                </Link>
              </div>
            )}
          </div>

          {/* ── Theme toggle ── */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
            aria-label="Toggle theme">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
