import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getUserOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  ACCEPTED:  { icon: Clock,         color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  label: 'Accepted'  },
  DELAYED:   { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Delayed'   },
  REJECTED:  { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    label: 'Rejected'  },
  DELIVERED: { icon: CheckCircle,   color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200',   label: 'Delivered' },
};

const MyOrders = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const userId = user?.userId ?? user?.id;
      const { data } = await getUserOrders(userId);
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Auto-refresh every 5s to pick up status changes from restaurant
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Package size={56} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Sign in to view your orders</h2>
      <Link to="/login" className="inline-block mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track your order status in real-time</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={56} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-bold text-gray-700 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm mb-6">Your order history will appear here</p>
          <Link to="/" className="inline-block bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors">Order Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.ACCEPTED;
            const Icon = cfg.icon;
            const totalItems = order.items?.reduce((s, i) => s + (i.qty ?? i.quantity ?? 0), 0) ?? 0;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-bold text-gray-800">Order <span className="font-mono text-gray-500 text-sm">#{order.id}</span></p>
                    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(order.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-sm mb-3">
                  <p className="text-gray-500 text-xs font-medium mb-1.5">Items ({totalItems})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {order.items?.map((item, i) => (
                      <span key={i} className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg text-xs">
                        {item.qty ?? item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500 text-xs">{order.deliveryAddress}</div>
                  <div className="font-bold text-gray-800">₹{order.totalAmount}</div>
                </div>

                {order.status === 'ACCEPTED' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Your order is being prepared · Est. {order.prepTime} min
                  </div>
                )}
                {order.status === 'DELAYED' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} /> Running a bit late — we apologize for the delay
                  </div>
                )}
                {order.status === 'DELIVERED' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <CheckCircle size={12} /> Delivered! Enjoy your meal 🎉
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
