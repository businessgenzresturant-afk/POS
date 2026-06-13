'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  MenuSquare, 
  ClipboardList, 
  ChefHat, 
  Receipt, 
  BarChart3, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/tables', label: 'Tables', icon: <UtensilsCrossed size={20} /> },
    { href: '/menu', label: 'Menu', icon: <MenuSquare size={20} /> },
    { href: '/orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { href: '/kot', label: 'KOT', icon: <ChefHat size={20} /> },
    { href: '/bills', label: 'Bills', icon: <Receipt size={20} /> },
    { href: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-72 h-screen flex-shrink-0 bg-white/70 backdrop-blur-2xl border-r border-slate-200 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] flex flex-col z-20 sticky top-0">
      <div className="p-6 border-b border-slate-200/50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-900 leading-tight tracking-tight">Gen-Z POS</h1>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Premium</p>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.01]'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/20 blur-md translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              )}
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-200/50 bg-slate-50/50 mt-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Powered by</p>
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">RagsPro™</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
            v1
          </div>
        </div>
      </div>
    </aside>
  );
}

Sidebar.displayName = 'Sidebar';