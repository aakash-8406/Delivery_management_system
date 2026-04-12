import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FoodCard = ({ item }) => {
  const { id, name, description, price, image, isVeg, isPopular } = item;
  const { items, addItem, decrementItem } = useCart();
  const cartItem = items.find(i => i.id === id);
  const qty = cartItem ? cartItem.qty : 0;

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center rounded-sm ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
          {isPopular && <span className="text-xs text-orange-500 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">Bestseller</span>}
        </div>
        <h4 className="font-semibold text-gray-800 text-sm leading-snug">{name}</h4>
        <p className="text-orange-500 font-bold mt-1">₹{price}</p>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{description}</p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        {qty === 0 ? (
          <button onClick={() => addItem(item)} className="w-24 flex items-center justify-center gap-1 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-bold text-sm py-1 rounded-xl transition-colors">
            <Plus size={14} /> ADD
          </button>
        ) : (
          <div className="w-24 flex items-center justify-between bg-orange-500 text-white rounded-xl px-2 py-1">
            <button onClick={() => decrementItem(id)}><Minus size={14} /></button>
            <span className="font-bold text-sm">{qty}</span>
            <button onClick={() => addItem(item)}><Plus size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
};
export default FoodCard;
