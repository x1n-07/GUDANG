import React from 'react';
import { useAppContext } from '../../store';
import { Package, Wrench, Truck, AlertTriangle, Users, Info, Building } from 'lucide-react';

interface DashboardViewProps {
  onTabChange: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onTabChange }) => {
  const { goods, equipment, vehicles, technicians, equipmentLogs, vehicleLogs, currentUser, companies, selectedBranchId, setSelectedBranchId } = useAppContext();

  const lowStockGoods = goods.filter(g => g.stock <= g.minStock);
  const brokenEquipment = equipment.filter(e => e.condition !== 'Baik');
  const activeVehicles = vehicles.filter(v => v.status === 'Sedang Digunakan' || v.status === 'Perbaikan');
  
  // Service alerts
  const vehiclesDueForService = vehicles.filter(v => 
    (v.odometer - v.lastOilChangeOdometer >= v.oilChangeInterval) || 
    (v.odometer - v.lastServiceOdometer >= v.serviceInterval)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Utama</h2>
          <p className="text-slate-500 mt-1">Ringkasan status sistem manajemen gudang</p>
        </div>

        {currentUser?.role === 'pengawas' && (
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Building size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Cabang:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">SEMUA CABANG</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          onClick={() => onTabChange('goods')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          aria-label="Lihat Stok Barang"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Barang</p>
            <p className="text-2xl font-bold text-slate-800">{goods.length}</p>
          </div>
        </button>
        
        <button
          onClick={() => onTabChange('equipment')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
          aria-label="Lihat Inventaris Alat"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Alat</p>
            <p className="text-2xl font-bold text-slate-800">{equipment.length}</p>
          </div>
        </button>

        <button
          onClick={() => onTabChange('vehicles')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
          aria-label="Lihat Kendaraan"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Kendaraan</p>
            <p className="text-2xl font-bold text-slate-800">{vehicles.length}</p>
          </div>
        </button>

        <button
          onClick={() => onTabChange('technicians')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
          aria-label="Lihat Daftar Teknisi"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Teknisi</p>
            <p className="text-2xl font-bold text-slate-800">{technicians.length}</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center">
                <AlertTriangle size={18} className="text-amber-500 mr-2" /> 
                Peringatan Stok Minimum
              </h3>
              <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                {lowStockGoods.length} Item
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {lowStockGoods.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">Batas minimum: {item.minStock} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${item.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      Sisa: {item.stock} {item.unit}
                    </p>
                    {item.stock === 0 && <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded mt-1 inline-block">Habis</span>}
                  </div>
                </div>
              ))}
              {lowStockGoods.length === 0 && (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Package size={32} className="text-slate-300 mb-2" />
                  <p>Stok barang dalam kondisi aman</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
                <Wrench size={18} className="text-indigo-500 mr-2" /> 
                <h3 className="font-bold text-slate-800">Alat Perlu Perhatian</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-auto">
                {brokenEquipment.map(item => (
                  <div key={item.id} className="p-4 flex flex-col hover:bg-slate-50 transition-colors">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <span className={`text-xs font-medium w-fit px-2 py-0.5 rounded mt-1 ${item.condition === 'Rusak Berat' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.condition}
                    </span>
                  </div>
                ))}
                {brokenEquipment.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">Semua alat dalam kondisi baik.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
                <Truck size={18} className="text-amber-600 mr-2" /> 
                <h3 className="font-bold text-slate-800">Servis & Oli Kendaraan</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-auto">
                {vehiclesDueForService.map(v => (
                  <div key={v.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{v.plateNumber}</p>
                    </div>
                    <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded">Perlu Perhatian</span>
                  </div>
                ))}
                {vehiclesDueForService.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">Semua kendaraan dalam kondisi prima.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Info size={18} className="text-blue-500 mr-2" /> 
              Aktivitas Terakhir
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {equipmentLogs.slice(0, 5).map(log => {
              const eq = equipment.find(e => e.id === log.equipmentId);
              return (
                <div key={log.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-400"></div>
                  <p className="text-sm font-medium text-slate-800">{log.user} <span className="font-normal text-slate-600">{log.action === 'PINJAM' ? 'meminjam' : 'mengembalikan'}</span> {eq?.name || 'Alat'}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.date).toLocaleString('id-ID')}</p>
                </div>
              )
            })}
            {vehicleLogs.slice(0, 5).map(log => {
              const v = vehicles.find(v => v.id === log.vehicleId);
              return (
                <div key={log.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-400"></div>
                  <p className="text-sm font-medium text-slate-800">{log.driver} <span className="font-normal text-slate-600">{log.status === 'JALAN' ? 'berangkat menggunakan' : 'selesai menggunakan'}</span> {v?.name || 'Kendaraan'}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.status === 'JALAN' ? log.startDate : (log.endDate || log.startDate)).toLocaleString('id-ID')}</p>
                </div>
              )
            })}
            {(equipmentLogs.length === 0 && vehicleLogs.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada aktivitas tercatat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
