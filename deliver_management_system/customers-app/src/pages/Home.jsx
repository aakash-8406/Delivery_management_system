import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import Loader from '../components/Loader';
import { getRestaurants, searchRestaurants } from '../services/api';

const CATEGORIES = ['All', 'Burgers', 'Pizza', 'Indian', 'Healthy', 'Sushi', 'Desserts', 'Mexican'];

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);

  const filterByCategory = (list, cat) =>
    cat === 'All' ? list : list.filter(r => r.cuisine?.toLowerCase().includes(cat.toLowerCase()));

  const fetchRestaurants = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await getRestaurants();
      const normalized = Array.isArray(data) ? data : [];
      setRestaurants(normalized);
      setFilteredResults(normalized);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setFilteredResults(filterByCategory(restaurants, activeCategory)); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await searchRestaurants(searchQuery);
        setFilteredResults(filterByCategory(data, activeCategory));
      } catch {
        setFilteredResults(filterByCategory(
          restaurants.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
          ), activeCategory));
      } finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]); // eslint-disable-line

  useEffect(() => {
    setFilteredResults(filterByCategory(searchQuery.trim() ? filteredResults : restaurants, activeCategory));
  }, [activeCategory]); // eslint-disable-line

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredResults(filterByCategory(restaurants, activeCategory));
    searchInputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl p-8 mb-8 overflow-hidden"
        style={{background: 'linear-gradient(135deg, #547cd1ff 0%, #4c75bcff 60%, #5ab5dcff 100%)'}}>

        {/* Decorative orbs */}
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full opacity-20"
          style={{background: 'radial-gradient(circle, #60a5fa, transparent)'}} />
        <div className="absolute right-10 -bottom-12 w-64 h-64 rounded-full opacity-15"
          style={{background: 'radial-gradient(circle, #93c5fd, transparent)'}} />
        <div className="absolute left-1/2 top-0 w-32 h-32 rounded-full opacity-10"
          style={{background: 'radial-gradient(circle, #bfdbfe, transparent)'}} />

        <div className="relative z-10">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">SmartQueue · BiteRush</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 leading-tight">
            Hungry? We've got you 🍔
          </h1>
          <p className="text-blue-100 mb-6 text-sm md:text-base opacity-90">
            Order from the best restaurants near you
          </p>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search restaurants or dishes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl text-[var(--foreground)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg placeholder-[var(--muted-foreground)]"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={16} />
              </button>
            )}
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-[var(--primary)] text-white shadow-md'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Section header ── */}
      {!loading && !error && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory === 'All' ? 'All Restaurants' : activeCategory}
            <span className="text-[var(--muted-foreground)] font-normal text-base ml-2">({filteredResults.length})</span>
          </h2>
          {searchQuery && (
            <button onClick={clearSearch} className="text-sm text-[var(--primary)] hover:opacity-80 font-medium flex items-center gap-1">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <Loader text="Finding restaurants near you..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-3xl">😕</div>
          <p className="text-[var(--foreground)] font-semibold text-lg">Failed to load restaurants</p>
          <button onClick={fetchRestaurants}
            className="px-6 py-2.5 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all">
            Try Again
          </button>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-[var(--foreground)] font-semibold text-lg">No results found</p>
          {searchQuery && (
            <button onClick={clearSearch}
              className="mt-4 px-5 py-2 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredResults.map(r => (
            <RestaurantCard key={r.id} restaurant={r} highlight={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
};
export default Home;
