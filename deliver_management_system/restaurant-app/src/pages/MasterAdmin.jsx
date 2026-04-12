import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShieldCheck, Trash2, RefreshCw, Store, Lock, LogOut, AlertTriangle } from 'lucide-react';
import { getAllRestaurants, deleteRestaurant } from '../services/api';

const MASTER_KEY = import.meta.env.VITE_MASTER_KEY ?? 'MASTER-SMARTQUEUE-2024';

export default function MasterAdmin() {
  const [authed, setAuthed]         = useState(() => sessionStorage.getItem('master_authed') === '1');
  const [keyInput, setKeyInput]     = useState('');
  const [keyError, setKeyError]     = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [deleting, setDeleting]     = useState(null); // restaurantId being deleted

  const handleUnlock = (e) => {
    e.preventDefault();
    if (keyInput === MASTER_KEY) {
      sessionStorage.setItem('master_authed', '1');
      setAuthed(true);
      setKeyError('');
    } else {
      setKeyError('Invalid master key');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('master_authed');
    setAuthed(false);
    setKeyInput('');
    setRestaurants([]);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllRestaurants();
      setRestaurants(data);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load restaurants');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const handleDelete = async (restaurantId, name) => {
    if (!confirm(`Permanently delete "${name}"?\n\nThis will remove the restaurant and all its menu data. Orders are NOT deleted.`)) return;
    setDeleting(restaurantId);
    try {
      await deleteRestaurant(restaurantId, MASTER_KEY);
      toast.success(`"${name}" deleted`);
      setRestaurants(prev => prev.filter(r => r.restaurantId !== restaurantId));
    } catch (err) {
      toast.error(err.message ?? 'Delete failed');
    } finally { setDeleting(null); }
  };

  // ── Lock screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="auth-bg min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 gap-3">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Master Admin</h1>
            <p className="text-[var(--muted-foreground)] text-sm text-center">Enter the master key to manage all restaurants</p>
          </div>

          <div className="glass rounded-2xl p-8">
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Master Key</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input type="password" value={keyInput} onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
                    placeholder="Enter master key..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    autoFocus />
                </div>
                {keyError && <p className="text-red-500 text-xs mt-1.5">{keyError}</p>}
              </div>
              <button type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Master panel ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Master Admin</h1>
            <p className="text-[var(--muted-foreground)] text-sm">{restaurants.length} registered restaurant{restaurants.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={14} /> Lock
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-600 dark:text-red-400">
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
        <span>Deleting a restaurant is permanent and cannot be undone. Orders placed by customers are retained.</span>
      </div>

      {/* Restaurant list */}
      {loading && restaurants.length === 0 ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[var(--muted-foreground)]">
          <RefreshCw size={20} className="animate-spin" /> Loading...
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 text-[var(--muted-foreground)]">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p>No restaurants registered yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map(r => (
            <div key={r.restaurantId}
              className="flex items-center gap-4 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow">

              {/* Cover image */}
              <div className="w-14 h-12 rounded-lg overflow-hidden bg-[var(--muted)] flex-shrink-0">
                {r.image
                  ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                  : <Store size={20} className="m-auto mt-3 text-[var(--muted-foreground)] opacity-40" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{r.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  {r.location && <span className="text-xs text-[var(--muted-foreground)]">📍 {r.location}</span>}
                  <span className="text-xs text-[var(--muted-foreground)]">🍽 {r.menu?.length ?? 0} items</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Joined {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(r.restaurantId, r.name)}
                disabled={deleting === r.restaurantId}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0">
                {deleting === r.restaurantId
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Trash2 size={13} />
                }
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
