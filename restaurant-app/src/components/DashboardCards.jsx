import { Activity, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export default function DashboardCards({ orders = [] }) {
  const pendingOrders = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'DELAYED');
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  
  const currentLoad = pendingOrders.length;
  const avgPrepTime = orders.length > 0 
    ? Math.round(orders.reduce((sum, o) => sum + o.prepTime, 0) / orders.length) 
    : 0;

  const stats = [
    {
      title: 'Current Load',
      value: currentLoad,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.length,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      title: 'Average Prep Time',
      value: `${avgPrepTime}m`,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Total Delivered',
      value: deliveredOrders.length,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-background border border-border p-6 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
          <div className={`${stat.bg} ${stat.color} p-4 rounded-lg group-hover:scale-110 transition-transform`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <h4 className="text-2xl font-bold">{stat.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}
