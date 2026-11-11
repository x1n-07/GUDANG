import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Package, Wrench, Truck, Users, Download, LogOut, UserCircle, Building } from 'lucide-react';
import { useAppContext } from '../store';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, companies, logout } = useAppContext();
  
  const allItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'goods', label: 'Stok Barang', icon: <Package size={20} /> },
    { id: 'equipment', label: 'Inventaris Alat', icon: <Wrench size={20} /> },
    { id: 'vehicles', label: 'Kendaraan', icon: <Truck size={20} /> },
    { id: 'technicians', label: 'Daftar Teknisi', icon: <Users size={20} /> },
    { id: 'export', label: 'Ekspor Data', icon: <Download size={20} /> },
  ];

  const navItems = currentUser?.role === 'superadmin'
    ? [...allItems, { id: 'users', label: 'Manajemen Akun', icon: <Building size={20} /> }]
    : currentUser?.role === 'admin'
    ? allItems
    : currentUser?.role === 'pengawas'
    ? allItems   // Pengawas dapat melihat semua menu (read-only)
    : currentUser?.role === 'teknisi'
    ? allItems.filter(item => item.id === 'technicians' || item.id === 'dashboard')
    : [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> }];

  const appTitle = currentUser?.companyId
    ? companies.find(company => company.id === currentUser.companyId)?.name?.toUpperCase() ?? 'KU'
    : 'KU';

  return (
    <div className="w-64 bg-slate-900 text-white h-full p-4 flex flex-col">
      <div className="mb-8 p-2 shrink-0">
        <h1 className="text-xl font-bold tracking-wider uppercase">GUDANG<span className="text-blue-400">{appTitle}</span></h1>
        <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Terpadu</p>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 pb-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
              activeTab === item.id 
                ? 'text-white bg-slate-800' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center space-x-3 px-2 py-3 bg-slate-800/50 rounded-lg mb-3">
          <UserCircle size={32} className="text-slate-400" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{currentUser?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors mb-4"
        >
          <LogOut size={16} />
          <span>Keluar</span>
        </button>
        <div className="text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Azis
        </div>
      </div>
    </div>
  );
};
