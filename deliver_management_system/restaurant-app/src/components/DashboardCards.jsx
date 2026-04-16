import { Activity, Clock, CheckCircle2, TrendingUp, IndianRupee, CalendarDays } from 'lucide-react';

export default function DashboardCards({ orders = [] }) {
  const now       = new Date();
  const todayStr  = now.toISOString().slice(0, 10);
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const pending   = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'DELAYED');

  const todayOrders   = delivered.filter(o => o.createdAt?.slice(0, 10) === todayStr);
  const monthOrders   = delivered.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const todaySales      = todayOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const monthlyRevenue  = monthOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const avgPrepTime     = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + (o.prepTime ?? 0), 0) / orders.length) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

      {/* Today's Sales — hero card */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 bg-white" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-emerald-100 uppercase tracking-widest">Today's Sales</p>
            <div className="bg-white/20 p-2 rounded-xl">
              <IndianRupee size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-bold tracking-tight">₹{todaySales.toLocaleString('en-IN')}</h3>
          <p className="text-emerald-100 text-sm mt-2">{todayOrders.length} orders delivered today</p>
          <div className="mt-4 h-1 bg-white/20 rounded-full">
            <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min((todayOrders.length / Math.max(orders.length, 1)) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Monthly Revenue — hero card */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 bg-white" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full opacity-10 bg-white" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Monthly Revenue</p>
            <div className="bg-white/20 p-2 rounded-xl">
              <CalendarDays size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-bold tracking-tight">₹{monthlyRevenue.toLocaleString('en-IN')}</h3>
          <p className="text-indigo-200 text-sm mt-2">{monthOrders.length} orders this month</p>
          <div className="mt-4 h-1 bg-white/20 rounded-full">
            <div className="h-1 bg-white rounded-full" style={{ width: `${Math.min((monthOrders.length / Math.max(orders.length, 1)) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-20 bg-white" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-amber-100 uppercase tracking-widest">Pending Orders</p>
            <div className="bg-white/20 p-2 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-bold tracking-tight">{pending.length}</h3>
          <p className="text-amber-100 text-sm mt-2">active in kitchen right now</p>
          {pending.length > 0 && (
            <div className="mt-3 flex gap-1">
              {pending.slice(0, 5).map((_, i) => (
                <div key={i} className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avg Prep Time */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-all group">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl group-hover:scale-110 transition-transform">
          <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Avg Prep Time</p>
          <h4 className="text-3xl font-bold mt-0.5">{avgPrepTime}<span className="text-lg font-medium text-[var(--muted-foreground)] ml-1">min</span></h4>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">across {orders.length} orders</p>
        </div>
      </div>

      {/* Total Delivered */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-all group">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl group-hover:scale-110 transition-transform">
          <CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Total Delivered</p>
          <h4 className="text-3xl font-bold mt-0.5">{delivered.length}</h4>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">all time orders</p>
        </div>
      </div>

      {/* Current Load */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-all group">
        <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-2xl group-hover:scale-110 transition-transform">
          <Activity size={24} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Current Load</p>
          <h4 className="text-3xl font-bold mt-0.5">{pending.length}</h4>
          <div className="mt-2 w-full bg-[var(--muted)] rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-rose-500 transition-all"
              style={{ width: `${Math.min((pending.length / Math.max(orders.length, 1)) * 100 * 3, 100)}%` }} />
          </div>
        </div>
      </div>

    </div>
  );
}
