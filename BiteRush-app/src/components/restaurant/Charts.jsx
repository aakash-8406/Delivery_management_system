import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  ACCEPTED: '#22c55e',
  DELAYED:  '#f97316',
  REJECTED: '#ef4444',
  DELIVERED:'#3b82f6',
};

export default function Charts({ orders = [] }) {
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (orders.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl text-center text-[var(--muted-foreground)] text-sm">
        No data available for charts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl shadow-sm">
        <h3 className="font-bold mb-4">Order Status Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-xl shadow-sm">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-start gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[order.status] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Order #{order.id} is {order.status}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {order.customerName} · {order.items?.length ?? 0} items
                </p>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
