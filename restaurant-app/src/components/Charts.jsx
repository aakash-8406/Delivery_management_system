import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = {
  ACCEPTED: '#22c55e', 
  DELAYED: '#f97316', 
  REJECTED: '#ef4444', 
  DELIVERED: '#3b82f6'
};

export default function Charts({ orders = [] }) {
  // Compute distribution
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  if (orders.length === 0) {
    return (
      <div className="bg-background border border-border p-6 rounded-xl shadow-sm text-center">
        No data available for charts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Distribution Chart */}
      <div className="bg-background border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-bold mb-4">Order Status Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Activity Log Simulation (Instead of Time-based chart which requires a lot of data) */}
      <div className="bg-background border border-border p-6 rounded-xl shadow-sm">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {orders.slice(0, 5).map((order) => (
            <div key={`activity-${order.id}`} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: COLORS[order.status] }}></div>
              <div>
                <p className="text-sm font-medium">Order #{order.id} is {order.status}</p>
                <p className="text-xs text-muted-foreground">
                   {order.customerName} ordered {order.items.length} items
                </p>
              </div>
              <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
