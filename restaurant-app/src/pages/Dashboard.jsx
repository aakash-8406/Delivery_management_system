import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw, Search, ArrowRight, Eye } from 'lucide-react';
import DashboardCards from '../components/DashboardCards';
import Charts from '../components/Charts';
import Modal from '../components/Modal';
import { fetchOrders, updateOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_BADGE = {
  ACCEPTED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800',
  DELAYED: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800',
  REJECTED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800',
  DELIVERED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { user } = useAuth();
  const restaurantId = user?.restaurantId;

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders(restaurantId);
      setOrders(data);
    } catch { toast.error('Failed to fetch orders'); }
    finally { setIsLoading(false); }
  }, [restaurantId]);

  useEffect(() => {
    loadOrders();
    let interval;
    if (autoRefresh) interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  // Also listen for localStorage changes from customer-app
  useEffect(() => {
    const handler = () => loadOrders();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadOrders]);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== 'ALL') result = result.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(o => o.customerName?.toLowerCase().includes(s) || o.id?.toLowerCase().includes(s));
    }
    setFilteredOrders(result);
  }, [search, statusFilter, orders]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateOrder(id, newStatus);
      toast.success(`Order #${id} → ${newStatus}`);
      loadOrders();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Dashboard</h1>
          <p className="text-[var(--muted-foreground)] mt-1">{user?.name ?? 'Monitor and manage orders in real-time.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--muted-foreground)]">
            Auto Refresh
            <div className="relative w-10 h-6">
              <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)}
                className="sr-only peer" />
              <div className="w-10 h-6 bg-[var(--muted)] rounded-full peer peer-checked:bg-[var(--primary)] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
          </label>
          <button onClick={() => { setIsLoading(true); loadOrders(); }}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium border border-[var(--border)]">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />Refresh
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <DashboardCards orders={orders} />
        <Charts orders={orders} />

        {/* Filters */}
        <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
            <input type="text" placeholder="Search ID or Customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--input)] rounded-lg bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ACCEPTED', 'DELAYED', 'REJECTED', 'DELIVERED'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === f ? 'bg-[var(--primary)] text-white' : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {isLoading && filteredOrders.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-12 text-center text-[var(--muted-foreground)]">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />Loading orders...
                  </td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-12 text-center text-[var(--muted-foreground)]">No orders match your filters.</td></tr>
                ) : filteredOrders.map(order => {
                  const totalItems = order.items?.reduce((s, i) => s + (i.qty ?? i.quantity ?? 0), 0) ?? 0;
                  return (
                    <tr key={order.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-[var(--muted-foreground)] text-xs">#{order.id}</td>
                      <td className="px-5 py-4 font-medium">{order.customerName}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedOrder(order)} className="text-[var(--primary)] hover:underline flex items-center gap-1 text-xs">
                          <Eye size={13} />View ({totalItems})
                        </button>
                      </td>
                      <td className="px-5 py-4 font-medium">₹{order.totalAmount ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[order.status] ?? ''}`}>{order.status}</span>
                      </td>
                      <td className="px-5 py-4 text-[var(--muted-foreground)] text-xs">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="block opacity-70">(~{order.prepTime}m)</span>
                      </td>
                      <td className="px-5 py-4">
                        {order.status !== 'DELIVERED' && order.status !== 'REJECTED' ? (
                          <div className="flex items-center gap-2">
                            {order.status !== 'DELAYED' && (
                              <button onClick={() => handleStatusUpdate(order.id, 'DELAYED')} className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors">Delay</button>
                            )}
                            <button onClick={() => handleStatusUpdate(order.id, 'REJECTED')} className="text-xs px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Reject</button>
                            <button onClick={() => handleStatusUpdate(order.id, 'DELIVERED')} className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-colors flex items-center gap-1">
                              Deliver <ArrowRight size={12} />
                            </button>
                          </div>
                        ) : <span className="text-[var(--muted-foreground)] italic text-xs">Closed</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.id}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div><p className="text-sm font-medium text-[var(--muted-foreground)]">Customer</p><p className="font-semibold">{selectedOrder.customerName}</p></div>
            {selectedOrder.deliveryAddress && <div><p className="text-sm font-medium text-[var(--muted-foreground)]">Delivery Address</p><p className="text-sm">{selectedOrder.deliveryAddress}</p></div>}
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Items</p>
              <ul className="space-y-2 border border-[var(--border)] rounded-lg p-3 bg-[var(--muted)]/10">
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm">
                    <span>{item.name}</span>
                    <span className="font-mono bg-[var(--primary)]/10 text-[var(--primary)] px-2 rounded-md">x{item.qty ?? item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            {selectedOrder.details && (
              <div><p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">Notes</p>
                <div className="text-sm p-3 bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 rounded-lg italic">"{selectedOrder.details}"</div>
              </div>
            )}
            <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
              <div className="flex-1"><p className="text-xs text-[var(--muted-foreground)]">Status</p><p className="font-bold">{selectedOrder.status}</p></div>
              <div className="flex-1 text-right"><p className="text-xs text-[var(--muted-foreground)]">Total</p><p className="font-bold">₹{selectedOrder.totalAmount}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
