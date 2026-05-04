import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRestaurant, registerRestaurant } from '../services/api';
import { UtensilsCrossed, Eye, EyeOff, Loader2, Lock, Mail, Store, MapPin } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', location: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setSession } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let result;
      if (tab === 'login') {
        result = await loginRestaurant(form.email, form.password);
      } else {
        if (!form.name.trim()) throw new Error('Restaurant name is required');
        if (form.password.length < 8 || !/\d/.test(form.password))
          throw new Error('Password must be at least 8 characters and contain a number');
        result = await registerRestaurant({ name: form.name, location: form.location, email: form.email, password: form.password });
      }
      setSession(result.restaurant, result.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg" style={{boxShadow:'0 0 28px rgba(29,107,243,0.3)'}}>
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">BiteRush</h1>
          <p className="text-[var(--muted-foreground)] text-sm">Restaurant Admin Portal</p>
        </div>

        <div className="glass rounded-2xl p-8" style={{boxShadow:'0 0 28px rgba(29,107,243,0.12)'}}>

          <div className="flex rounded-xl p-1 mb-6 gap-1" style={{background:'var(--muted)'}}>
            {['login','register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Restaurant Name</label>
                  <div className="relative">
                    <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Burger Palace"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Bangalore, India"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@restaurant.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                  required autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                  required autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" />{tab === 'login' ? 'Signing in...' : 'Registering...'}</> : (tab === 'login' ? 'Sign In' : 'Register Restaurant')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
