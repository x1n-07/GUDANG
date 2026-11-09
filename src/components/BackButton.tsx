import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../store';

export const BackButton: React.FC = () => {
  const { goBack, canGoBack, navHistory, currentNavIndex } = useAppContext();

  if (!canGoBack) return null;

  const previousTab = navHistory[currentNavIndex - 1];
  const tabLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    goods: 'Stok Barang',
    equipment: 'Inventaris Alat',
    vehicles: 'Kendaraan',
    technicians: 'Daftar Teknisi',
    export: 'Ekspor Data',
    users: 'Manajemen Akun',
  };

  return (
    <button
      onClick={goBack}
      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-2"
      title={`Kembali ke ${tabLabels[previousTab] || previousTab}`}
      aria-label={`Kembali ke ${tabLabels[previousTab] || previousTab}`}
    >
      <ArrowLeft size={20} />
    </button>
  );
};