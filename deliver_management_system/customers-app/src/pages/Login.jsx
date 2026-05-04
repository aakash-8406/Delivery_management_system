import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, forgotPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    if (!isLogin && !form.name.trim()) { setError('Please enter your name'); return; }
    if (!isLogin && (form.password.length < 8 || !/\d/.test(form.password))) {
      setError('Password must be at least 8 characters and contain a number'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isLogin) {
        const { data } = await loginUser({ email: form.email, password: form.password });
        login(data.user, data.token);
        setSuccess('Signed in!');
        setTimeout(() => navigate('/'), 400);
      } else {
        const { data } = await registerUser({ name: form.name, email: form.email, password: form.password });
        login(data.user, data.token);
        setSuccess('Account created!');
        setTimeout(() => navigate('/'), 400);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { setForgotError('Please enter your email.'); return; }
    setForgotLoading(true); setForgotError(''); setForgotMsg('');
    try { const { data } = await forgotPassword(forgotEmail); setForgotMsg(data.message); }
    catch (err) { setForgotError(err.message); }
    finally { setForgotLoading(false); }
  };

  return (
    <div className="auth-bg min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-lg" style={{boxShadow:'0 0 28px rgba(29,107,243,0.3)'}}>
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">BiteRush</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{isLogin ? 'Sign in to continue ordering' : 'Join BiteRush today'}</p>
        </div>

        <div className="glass rounded-2xl p-8" style={{boxShadow:'0 0 28px rgba(29,107,243,0.12)'}}>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6 gap-1" style={{background:'var(--muted)'}}>
            {['Login', 'Sign Up'].map((label, i) => (
              <button key={label} onClick={() => { setIsLogin(i === 0); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${(i === 0) === isLogin ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
            {success && <p className="text-green-600 text-sm bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">{success}</p>}
            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => { setShowForgot(!showForgot); setForgotMsg(''); setForgotError(''); }}
                  className="text-[var(--primary)] text-sm hover:underline">Forgot password?</button>
              </div>
            )}
            {isLogin && showForgot && (
              <div className="bg-[var(--secondary)] rounded-xl p-4 space-y-3 border border-[var(--border)]">
                <p className="text-sm font-medium">Enter your email to receive a reset link</p>
                <form onSubmit={handleForgot} className="flex gap-2">
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--input)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                  <button type="submit" disabled={forgotLoading}
                    className="bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
                    {forgotLoading ? 'Sending...' : 'Send'}
                  </button>
                </form>
                {forgotMsg && <p className="text-green-600 text-xs">{forgotMsg}</p>}
                {forgotError && <p className="text-red-500 text-xs">{forgotError}</p>}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isLogin ? 'Signing in...' : 'Creating...'}</>
                : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

        </div>

        <p className="text-center text-[var(--muted-foreground)] text-sm mt-5">
          {isLogin ? 'New to BiteRush? ' : 'Already have an account? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-[var(--primary)] font-semibold hover:underline">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
export default Login;
