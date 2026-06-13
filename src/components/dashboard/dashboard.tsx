'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Users, 
  UtensilsCrossed, 
  ClipboardList, 
  IndianRupee, 
  ChefHat, 
  ArrowRight,
  MenuSquare,
  Receipt,
  BarChart3,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalTables: number;
  occupiedTables: number;
  pendingOrders: number;
  totalRevenue: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tablesRes, ordersRes, reportsRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/orders'),
        fetch('/api/reports'),
      ]);

      const tables = await tablesRes.json();
      const orders = await ordersRes.json();
      const reports = await reportsRes.json();

      const occupiedTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;
      const pendingOrders = orders.filter((o: any) =>
        ['PENDING', 'PREPARING', 'READY'].includes(o.status)
      ).length;

      setStats({
        totalTables: tables.length,
        occupiedTables,
        pendingOrders,
        totalRevenue: reports.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtext, icon, colorFrom, colorTo, iconColor }: any) => (
    <Card className="p-6 card-enhanced">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`text-4xl font-black mt-2 bg-gradient-to-r ${colorFrom} ${colorTo} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`p-4 rounded-2xl bg-${iconColor}-50 text-${iconColor}-500 shadow-sm border border-${iconColor}-100`}>
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {subtext}
        </p>
      </div>
    </Card>
  );

  const QuickActionCard = ({ title, desc, href, icon, color }: any) => (
    <Link href={href}>
      <Card className="p-6 card-enhanced cursor-pointer group hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${color}-50 to-${color}-100 flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform duration-300 border border-${color}-100 shadow-sm`}>
            {icon}
          </div>
          <div className={`w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-${color}-500 group-hover:border-${color}-500 transition-all duration-300`}>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500">{desc}</p>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Gen-Z Restaurant Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tables Occupied"
          value={`${stats?.occupiedTables ?? 0}/${stats?.totalTables ?? 0}`}
          subtext={`${(stats?.totalTables ?? 0) - (stats?.occupiedTables ?? 0)} tables available`}
          icon={<UtensilsCrossed size={28} />}
          colorFrom="from-blue-600"
          colorTo="to-indigo-600"
          iconColor="blue"
        />
        <StatCard
          title="Active Orders"
          value={stats?.pendingOrders ?? 0}
          subtext="Orders in progress"
          icon={<ClipboardList size={28} />}
          colorFrom="from-amber-500"
          colorTo="to-orange-500"
          iconColor="amber"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
          subtext="Total sales today"
          icon={<IndianRupee size={28} />}
          colorFrom="from-emerald-500"
          colorTo="to-teal-500"
          iconColor="emerald"
        />
        <StatCard
          title="Kitchen Status"
          value={stats?.pendingOrders && stats.pendingOrders > 5 ? 'Busy' : 'Normal'}
          subtext="Kitchen workload"
          icon={<ChefHat size={28} />}
          colorFrom="from-rose-500"
          colorTo="to-red-500"
          iconColor="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Table Management"
            desc="View and manage restaurant tables"
            href="/tables"
            icon={<UtensilsCrossed size={24} />}
            color="blue"
          />
          <QuickActionCard
            title="Create Order"
            desc="Take new customer orders"
            href="/orders"
            icon={<ClipboardList size={24} />}
            color="amber"
          />
          <QuickActionCard
            title="Kitchen Queue"
            desc="View pending orders in kitchen"
            href="/kot"
            icon={<ChefHat size={24} />}
            color="rose"
          />
          <QuickActionCard
            title="Menu Items"
            desc="Manage menu and prices"
            href="/menu"
            icon={<MenuSquare size={24} />}
            color="emerald"
          />
          <QuickActionCard
            title="Billing"
            desc="Generate and view bills"
            href="/bills"
            icon={<Receipt size={24} />}
            color="indigo"
          />
          <QuickActionCard
            title="Reports"
            desc="Sales and analytics"
            href="/reports"
            icon={<BarChart3 size={24} />}
            color="violet"
          />
        </div>
      </div>
    </div>
  );
}