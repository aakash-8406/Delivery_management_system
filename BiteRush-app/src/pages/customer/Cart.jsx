import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { placeOrder } from '../../services/api';

const DELIVERY_FEE = 29;
const PLATFORM_FEE = 5;

const Cart = () => {
  const navigate = useNavigate();
  const { items, addItem, decrementItem, removeItem, clearCart, totalItems, totalPrice, restaurantId } = useCart();
  const { user, isAuthenticated } = useCustomerAuth();
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError]     = useState(null);
  const [orderId, setOrderId]           = useState(null);

  const [address, setAddress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('biterush_address')) || { line1: '', city: '', pincode: '' }; }
    catch { return { line1: '', city: '', pincode: '' }; }
  });
  const [addressError, setAddressError] = useState(null);

  const updateAddress = (updater) => {
    setAddress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('biterush_address', JSON.stringify(next));
      return next;
    });
  };

  const grandTotal = totalPrice + DELIVERY_FEE + PLATFORM_FEE;

  const validateAddress = () => {
    if (!address.line1.trim()) return 'Please enter your street address.';
    if (!address.city.trim()) return 'Please enter your city.';
    if (!/^\d{6}$/.test(address.pincode.trim())) return 'Please enter a valid 6-digit pincode.';
    return null;
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const err = validateAddress();
    if (err) { setAddressError(err); return; }
    setAddressError(null); setOrderLoading(true); setOrderError(null);
    try {
      const deliveryAddress = `${address.line1.trim()}, ${address.city.trim()} - ${address.pincode.trim()}`;
      const res = await placeOrder({
        userId:          user?.userId ?? user?.id,
        customerName:    user?.name   ?? user?.email,
        restaurantId:    restaurantId ?? 'default',
        items:           items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        totalAmount:     grandTotal, deliveryFee: DELIVERY_FEE, platformFee: PLATFORM_FEE, deliveryAddress,
      });
      const data = res.data ?? res;
      setOrderId(data?.orderId ?? data?.id ?? 'ORD' + Date.now());
      clearCart();
    } catch (err) { setOrderError(err.message); }
    finally { setOrderLoading(false); }
  };

  if (orderId) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <CheckCircle size={72} className="mx-auto text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Order Placed!</h2>
      <p className="text-[var(--muted-foreground)] mb-1">Your food is being prepared.</p>
      <p className="text-[var(--muted-foreground)] text-sm mb-1">Order ID: <span className="font-mono">{orderId}</span></p>
      <p className="text-[var(--muted-foreground)] text-sm mb-6">Estimated delivery: 30–40 min</p>
      <Link to="/" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
        Order More Food
      </Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <ShoppingBag size={64} className="mx-auto text-[var(--border)] mb-4" />
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Your cart is empty</h2>
      <p className="text-[var(--muted-foreground)] mb-6">Add some delicious food to get started</p>
      <Link to="/" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
        Browse Restaurants
      </Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-orange-500 mb-5 text-sm transition-colors">
        <ArrowLeft size={16} />Continue shopping
      </Link>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-5">
        Your Cart <span className="text-[var(--muted-foreground)] font-normal text-base ml-2">({totalItems} items)</span>
      </h1>

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden mb-4">
        {items.map((item, idx) => (
          <div key={item.id} className={`flex items-center gap-4 p-4 ${idx !== items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
            <img src={item.image} alt={item.name} className="w-16 h-14 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--foreground)] text-sm truncate">{item.name}</p>
              <p className="text-orange-500 font-bold text-sm mt-0.5">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-2 py-1">
              <button onClick={() => decrementItem(item.id)} className="text-orange-500 hover:text-orange-700"><Minus size={14} /></button>
              <span className="font-bold text-[var(--foreground)] text-sm w-4 text-center">{item.qty}</span>
              <button onClick={() => addItem(item)} className="text-orange-500 hover:text-orange-700"><Plus size={14} /></button>
            </div>
            <p className="font-bold text-[var(--foreground)] text-sm w-14 text-right">₹{item.price * item.qty}</p>
            <button onClick={() => removeItem(item.id)} className="text-[var(--muted-foreground)] hover:text-red-400 transition-colors ml-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-5 mb-4">
        <h3 className="font-bold text-[var(--foreground)] mb-4">Bill Details</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-[var(--muted-foreground)]"><span>Item Total</span><span>₹{totalPrice}</span></div>
          <div className="flex justify-between text-[var(--muted-foreground)]"><span>Delivery Fee</span><span>₹{DELIVERY_FEE}</span></div>
          <div className="flex justify-between text-[var(--muted-foreground)]"><span>Platform Fee</span><span>₹{PLATFORM_FEE}</span></div>
          <div className="border-t border-dashed border-[var(--border)] pt-2.5 flex justify-between font-bold text-[var(--foreground)] text-base">
            <span>To Pay</span><span>₹{grandTotal}</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-5 mb-4">
        <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-orange-500" />Delivery Address
        </h3>
        <div className="space-y-3">
          <input type="text" placeholder="Street address, flat / house no." value={address.line1}
            onChange={e => updateAddress(a => ({ ...a, line1: e.target.value }))}
            className="w-full border border-[var(--input)] rounded-xl px-4 py-2.5 text-sm bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-orange-400 transition-colors placeholder-[var(--muted-foreground)]" />
          <div className="flex gap-3">
            <input type="text" placeholder="City" value={address.city}
              onChange={e => updateAddress(a => ({ ...a, city: e.target.value }))}
              className="flex-1 border border-[var(--input)] rounded-xl px-4 py-2.5 text-sm bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-orange-400 transition-colors placeholder-[var(--muted-foreground)]" />
            <input type="text" placeholder="Pincode" value={address.pincode} maxLength={6}
              onChange={e => updateAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
              className="w-32 border border-[var(--input)] rounded-xl px-4 py-2.5 text-sm bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-orange-400 transition-colors placeholder-[var(--muted-foreground)]" />
          </div>
        </div>
        {addressError && <p className="text-red-500 text-xs mt-2">{addressError}</p>}
      </div>

      {orderError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{orderError}</div>}
      {!isAuthenticated && (
        <div className="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-xl mb-4">
          You need to <Link to="/login" className="font-semibold underline">sign in</Link> before placing an order.
        </div>
      )}

      <button onClick={handleCheckout} disabled={orderLoading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg flex items-center justify-center gap-2">
        {orderLoading
          ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Placing Order...</>
          : `Place Order · ₹${grandTotal}`}
      </button>
    </div>
  );
};
export default Cart;
