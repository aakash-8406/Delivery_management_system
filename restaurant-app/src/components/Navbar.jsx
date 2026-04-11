import { useNavigate, NavLink } from 'react-router-dom';
import { Moon, Sun, UtensilsCrossed, LogOut, Store, LayoutDashboard, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    isDark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 dark:bg-[var(--card)]/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="gradient-text">BiteRush</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full ml-1">Restaurant</span>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden md:flex items-center gap-1 mr-2">
              <NavLink to="/dashboard"
                className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'}`}>
                <LayoutDashboard size={14} /> Orders
              </NavLink>
              <NavLink to="/menu"
                className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'}`}>
                <BookOpen size={14} /> Menu
              </NavLink>
            </div>
          )}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-sm">
              <Store size={14} className="text-[var(--primary)]" />
              <span className="font-medium">{user?.name ?? user?.restaurantId}</span>
            </div>
          )}
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]" aria-label="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user && (
            <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut size={15} /><span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
