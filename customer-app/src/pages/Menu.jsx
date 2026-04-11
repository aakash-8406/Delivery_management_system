import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Bike, ShoppingCart } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import Loader from '../components/Loader';
import { useCart } from '../context/CartContext';
import { getRestaurantById, getMenuByRestaurant } from '../services/api';

const Menu = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const { totalItems, totalPrice, setRestaurantId } = useCart();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const [rRes, mRes] = await Promise.all([getRestaurantById(id), getMenuByRestaurant(id)]);
        setRestaurant(rRes.data);
        setMenu(Array.isArray(mRes.data) ? mRes.data : []);
        // Tell the cart which restaurant these items belong to
        setRestaurantId(id);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <Loader text="Loading menu..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <p className="text-gray-700 font-semibold text-lg">Failed to load menu</p>
      <Link to="/" className="px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">Go back home</Link>
    </div>
  );
  if (!restaurant) return <div className="text-center py-20"><p className="text-gray-500 text-lg">Restaurant not found</p><Link to="/" className="text-orange-500 mt-2 inline-block hover:underline">Go back home</Link></div>;

  const categories = ['All', ...new Set(menu.map(i => i.category))];
  const filtered = activeCategory === 'All' ? menu : menu.filter(i => i.category === activeCategory);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-orange-500 mb-4 text-sm transition-colors"><ArrowLeft size={16} />Back to restaurants</Link>
      <div className="relative rounded-2xl overflow-hidden mb-6 shadow-md">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 text-white">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-300 text-sm mt-0.5">{restaurant.cuisine}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1 bg-green-500 px-2 py-0.5 rounded-md font-semibold"><Star size={12} fill="white" />{restaurant.rating}</span>
            <span className="flex items-center gap-1 text-gray-200"><Clock size={13} />{restaurant.deliveryTime}</span>
            <span className="flex items-center gap-1 text-gray-200"><Bike size={13} />{restaurant.deliveryFee === 0 ? 'Free delivery' : `₹${restaurant.deliveryFee} delivery`}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <p className="text-center text-gray-400 py-10">No items in this category</p> : (
        <div className="flex flex-col gap-3">{filtered.map(item => <FoodCard key={item.id} item={item} />)}</div>
      )}

      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <Link to="/cart" className="flex items-center justify-between bg-orange-500 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-orange-300/50 hover:bg-orange-600 transition-colors">
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="font-semibold flex items-center gap-2"><ShoppingCart size={16} />View Cart</span>
            <span className="font-bold">₹{totalPrice}</span>
          </Link>
        </div>
      )}
    </div>
  );
};
export default Menu;
