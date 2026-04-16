import { Activity, Clock, CheckCircle2, TrendingUp, IndianRupee, CalendarDays } from 'lucide-react';

export default function DashboardCards({ orders = [] }) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const pending   = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'DELAYED');

  // Today's sales — delivered orders placed today
  const todaySales = delivered
    .filter(o => o.createdAt?.slice(0, 10) === todayStr)
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // Monthly revenue — delivered orders this calendar month
  const monthlyRevenue = delivered
    .filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const avgPrepTime = orders.length > 0
    ? Math.round(orders.reduce((sum, o) => sum + (o.prepTime ?? 0), 0) / orders.length)
    : 0;

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${todaySales.toLocaleString('en-IN')}`,
      sub: `${delivered.filter(o => o.createdAt?.slice(0, 10) === todayStr).length} orders`,
      icon: IndianRupee,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Monthly Revenue',
      value: `₹${monthlyRevenue.toLocaleString('en-IN')}`,
      sub: `${delivered.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).length} delivered`,
      icon: CalendarDays,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Pending Orders',
      value: pending.length,
      sub: 'active right now',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: 'Avg Prep Time',
      value: `${avgPrepTime}m`,
      sub: `${delivered.length} total delivered`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Current Load',
      value: pending.length,
      sub: 'orders in kitchen',
      icon: Activity,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      title: 'Total Delivered',
      value: delivered.length,
      sub: 'all time',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
          <div className={`${stat.bg} ${stat.color} p-3.5 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0`}>
            <stat.icon size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--muted-foreground)] truncate">{stat.title}</p>
            <h4 className="text-2xl font-bold tracking-tight">{stat.value}</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
