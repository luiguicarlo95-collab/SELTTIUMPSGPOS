
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardStats {
  dailySales: { total: number };
  weeklySales: { total: number };
  monthlySales: { total: number };
  totalProducts: { count: number };
  lowStock: { count: number };
  salesTrend: { date: string, sales: number }[];
  salesByCategory: { name: string, value: number }[];
  recentSales: any[];
  lowStockProducts: any[];
  cashBalance: { balance: number };
  totalProfit: { total: number };
  monthlyProfit: { total: number };
  outstandingCredit: { total: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const fetchStats = () => {
    apiFetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    apiFetch('/api/settings').then(res => res.json()).then(setSettings);
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Cargando Datos...</p>
        </div>
      </div>
    );
  }

  const isDark = settings?.theme_mode === 'dark';

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Area */}
      <div className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6",
        isDark ? "border-b border-gray-800" : "border-b border-gray-100"
      )}>
        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <LayoutDashboard size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Terminal de Control</span>
          </div>
          <h1 className={cn(
            "text-4xl font-black tracking-tighter",
            isDark ? "text-white" : "text-gray-900"
          )}>PANEL DE CONTROL</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full border border-green-200/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>SISTEMA ONLINE</span>
          </div>
          <div className="text-gray-300">|</div>
          <div className={cn("font-bold", isDark ? "text-white" : "text-gray-900")}>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <KpiCard 
          label="Ventas del Día" 
          value={formatCurrency(stats.dailySales?.total || 0)} 
          sub="Ventas totales hoy"
          icon={<DollarSign size={20} />}
          color="bg-green-500"
          isDark={isDark}
        />
        {(settings?.user_role === 'ADMINISTRADOR' || settings?.user_role === 'DESARROLLADOR') && (
          <KpiCard 
            label="Utilidad del Día" 
            value={formatCurrency(stats.totalProfit?.total || 0)} 
            sub="Ganancia real hoy"
            icon={<TrendingUp size={20} />}
            color="bg-emerald-600"
            isDark={isDark}
          />
        )}
        <KpiCard 
          label="Cuentas por Cobrar" 
          value={formatCurrency(stats.outstandingCredit?.total || 0)} 
          sub="Deuda total clientes"
          icon={<Users size={20} />}
          color="bg-red-500"
          isDark={isDark}
        />
        <KpiCard 
          label="Caja Actual" 
          value={formatCurrency(stats.cashBalance?.balance || 0)} 
          sub="Efectivo en mano"
          icon={<ShoppingCart size={20} />}
          color="bg-purple-500"
          isDark={isDark}
        />
        <KpiCard 
          label="Ventas del Mes" 
          value={formatCurrency(stats.monthlySales?.total || 0)} 
          sub="Mes en curso"
          icon={<TrendingUp size={20} />}
          color="bg-blue-500"
          isDark={isDark}
        />
        {(settings?.user_role === 'ADMINISTRADOR' || settings?.user_role === 'DESARROLLADOR') && (
          <KpiCard 
            label="Utilidad del Mes" 
            value={formatCurrency(stats.monthlyProfit?.total || 0)} 
            sub="Ganancia acumulada"
            icon={<ArrowUpRight size={20} />}
            color="bg-indigo-500"
            isDark={isDark}
          />
        )}
        <KpiCard 
          label="Alerta Stock" 
          value={String(stats.lowStock?.count || 0)} 
          sub="Productos críticos"
          icon={<AlertTriangle size={20} />}
          color="bg-orange-500"
          alert={ (stats.lowStock?.count || 0) > 0 }
          isDark={isDark}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className={cn(
          "lg:col-span-2 p-6 rounded-3xl shadow-sm border transition-all",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Tendencia de Ventas (7D)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#F3F4F6"} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: isDark ? '#FFF' : '#000',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                />
                <Bar dataKey="sales" fill={settings?.primary_color || '#22c55e'} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart / Distribution */}
        <div className={cn(
          "p-6 rounded-3xl shadow-sm border transition-all",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        )}>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-8">Categorías Más Vendidas</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.salesByCategory}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
            {stats.salesByCategory.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{cat.name}</span>
                </div>
                <span className={cn("text-xs font-black", isDark ? "text-white" : "text-gray-900")}>{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className={cn(
          "p-8 rounded-[2.5rem] shadow-sm border overflow-hidden",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Recientes</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={16} />
            </div>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                  <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">ID</th>
                  <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cliente</th>
                  <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">Método</th>
                  <th className="py-4 px-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {stats.recentSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className={cn("py-5 px-2 font-black text-xs", isDark ? "text-gray-400" : "text-gray-500")}>#V{String(sale.id).padStart(4, '0')}</td>
                    <td className={cn("py-5 px-2 text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{sale.first_name || 'Public'}</td>
                    <td className="py-5 px-2">
                       <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{sale.payment_method}</span>
                    </td>
                    <td className="py-5 px-2 text-right font-black text-green-500">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Attention */}
        <div className={cn(
          "p-8 rounded-[2.5rem] shadow-sm border overflow-hidden",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Stock Crítico</h3>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="space-y-4">
            {stats.lowStockProducts.map((p) => (
              <div key={p.id} className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                isDark ? "bg-gray-800/20 border-gray-800 hover:border-orange-900/50" : "bg-gray-50/50 border-gray-100 hover:border-orange-100"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black text-xs">
                    {p.id}
                  </div>
                  <div>
                    <h4 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{p.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Stock Min: {p.min_stock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-xs font-black",
                    p.stock <= p.min_stock / 2 ? "text-red-500" : "text-orange-500"
                  )}>
                    {p.stock} <span className="text-[10px] text-gray-400">/ {p.min_stock}</span>
                  </div>
                  <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 mt-2 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        p.stock <= p.min_stock / 2 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                      )}
                      style={{ width: `${Math.min(100, (p.stock / p.min_stock) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {stats.lowStockProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                <Package size={40} strokeWidth={1} className="opacity-20" />
                <p className="text-[10px] font-black mt-4 uppercase tracking-[0.2em] opacity-40">Todo en orden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, color, alert, isDark }: { label: string, value: string, sub?: string, icon: React.ReactNode, color: string, alert?: boolean, isDark?: boolean }) {
  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] transition-all border shadow-sm relative overflow-hidden group",
      isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100",
      alert && (isDark ? "border-red-900/50 bg-red-900/10" : "border-red-100 bg-red-50/30")
    )}>
      {/* Decorative gradient */}
      <div className={cn(
        "absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity rounded-full",
        color
      )} />

      <div className="flex items-center justify-between mb-6 relative">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
          color,
          color === 'bg-green-500' && "shadow-green-500/20",
          color === 'bg-blue-500' && "shadow-blue-500/20",
          color === 'bg-purple-500' && "shadow-purple-500/20",
          color === 'bg-orange-500' && "shadow-orange-500/20"
        )}>
          {icon}
        </div>
        {alert && (
          <div className="flex items-center gap-2">
             <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">Alerta</div>
             <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          </div>
        )}
      </div>
      <div className="relative">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</h3>
        <p className={cn(
          "text-3xl font-black tracking-tighter",
          isDark ? "text-white" : "text-gray-900"
        )}>{value}</p>
        <div className="flex items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
           <ArrowUpRight size={14} className="text-green-500 mr-1" />
           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{sub}</p>
        </div>
      </div>
    </div>
  );
}

const PIE_COLORS = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];
