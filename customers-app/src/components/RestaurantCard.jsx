import { Link } from 'react-router-dom';
import { Star, Clock, Bike } from 'lucide-react';

const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = String(text).split(regex);
  return <span>{parts.map((p, i) => regex.test(p) ? <mark key={i} className="bg-orange-200 text-orange-800 rounded-sm px-0.5">{p}</mark> : <span key={i}>{p}</span>)}</span>;
};

const RestaurantCard = ({ restaurant, highlight = '' }) => {
  const { id, name, cuisine, rating, deliveryTime, deliveryFee, image, offer, isVeg } = restaurant;
  return (
    <Link to={`/menu/${id}`} className="group bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-[var(--border)]">
      <div className="relative overflow-hidden h-44">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {offer && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <span className="text-white text-xs font-semibold">{offer}</span>
          </div>
        )}
        {isVeg && <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">Pure Veg</span>}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[var(--foreground)] text-base truncate"><Highlight text={name} query={highlight} /></h3>
        <p className="text-[var(--muted-foreground)] text-sm truncate mt-0.5"><Highlight text={cuisine} query={highlight} /></p>
        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-2 py-0.5 rounded-md"><Star size={12} fill="currentColor" />{rating}</span>
          <span className="flex items-center gap-1 text-[var(--muted-foreground)]"><Clock size={13} />{deliveryTime}</span>
          <span className="flex items-center gap-1 text-[var(--muted-foreground)]"><Bike size={13} />{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
        </div>
      </div>
    </Link>
  );
};
export default RestaurantCard;
