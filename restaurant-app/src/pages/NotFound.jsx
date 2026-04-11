import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="max-w-md mx-auto px-4 py-24 text-center">
    <p className="text-7xl mb-4">📋</p>
    <h1 className="text-3xl font-bold mb-2">Page not found</h1>
    <p className="text-[var(--muted-foreground)] mb-8">This page doesn't exist.</p>
    <Link to="/dashboard" className="inline-block bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all">Back to Dashboard</Link>
  </div>
);
export default NotFound;
