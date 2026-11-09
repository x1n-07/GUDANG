import React, { useState } from 'react';
import { useAppContext } from '../../store';
import { Plus, ArrowDown, ArrowUp, History, Trash2 } from 'lucide-react';
import { TransactionType } from '../../types';
import { motion } from 'motion/react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const GoodsView: React.FC = () => {
  const { goods, goodsTransactions, technicians, addGoodsItem, addGoodsTransaction, removeGoodsItem, currentUser } = useAppContext();
  const canManageGoods = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [activeTab, setActiveTab] = useState<'stok' | 'riwayat'>('stok');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form states
  const [newItem, setNewItem] = useState({ name: '', category: '', stock: 0, minStock: 0, unit: '' });
  const [txForm, setTxForm] = useState({ type: 'IN' as TransactionType, quantity: 1, notes: '', pic: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (goods.some(g => g.name.toLowerCase() === newItem.name.trim().toLowerCase())) {
      return;
    }
    addGoodsItem({ ...newItem, name: newItem.name.trim() });
    setIsAddModalOpen(false);
    setNewItem({ name: '', category: '', stock: 0, minStock: 0, unit: '' });
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    addGoodsTransaction({
      itemId: selectedItemId,
      type: txForm.type,
      quantity: Number(txForm.quantity),
      notes: txForm.notes,
      pic: txForm.pic
    });
    setIsTxModalOpen(false);
    setTxForm({ type: 'IN', quantity: 1, notes: '', pic: '' });
  };

  const filteredGoods = goods.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exactMatch = goods.some(g => g.name.toLowerCase() === newItem.name.trim().toLowerCase());
  const similarGoods = newItem.name.trim().length > 1 
    ? goods.filter(g => g.name.toLowerCase().includes(newItem.name.trim().toLowerCase()) && g.name.toLowerCase() !== newItem.name.trim().toLowerCase()).slice(0, 3) 
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Manajemen Stok Barang</h2>
      </div>

      <div className="flex flex-col md:flex-row border-b border-slate-200 justify-between items-start md:items-center gap-4">
        <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button
            className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'stok' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('stok')}
          >
            Daftar Stok
            {activeTab === 'stok' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button
            className={`whitespace-nowrap px-6 py-3 font-medium text-sm transition-colors relative flex items-center ${activeTab === 'riwayat' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('riwayat')}
          >
            <History size={16} className="mr-2" /> Riwayat Transaksi
            {activeTab === 'riwayat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        </div>
        {activeTab === 'stok' && (
          <div className="w-full md:w-auto pb-2 flex flex-col md:flex-row md:items-center md:gap-4">
            <input
              type="text"
              placeholder="Cari nama atau kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full md:w-64"
            />
            {canManageGoods && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={18} className="mr-2" />
                Barang Baru
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'stok' ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Nama Barang</th>
                <th className="p-4 font-semibold text-sm">Kategori</th>
                <th className="p-4 font-semibold text-sm">Stok</th>
                <th className="p-4 font-semibold text-sm">Satuan</th>
                <th className="p-4 font-semibold text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGoods.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 text-xs rounded-full">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`font-bold ${item.stock <= item.minStock ? 'text-red-500' : 'text-slate-700'}`}>
                        {item.stock}
                      </span>
                      <span className="text-xs text-slate-400">Min: {item.minStock}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{item.unit}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedItemId(item.id); setTxForm(prev => ({...prev, type: 'IN'})); setIsTxModalOpen(true); }}
                      className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                      disabled={!canManageGoods}
                    >
                      Masuk
                    </button>
                    <button 
                      onClick={() => { setSelectedItemId(item.id); setTxForm(prev => ({...prev, type: 'OUT'})); setIsTxModalOpen(true); }}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                      disabled={!canManageGoods || item.stock === 0}
                    >
                      Keluar
                    </button>
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                      <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Hapus Barang"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {goods.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data barang</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Waktu</th>
                <th className="p-4 font-semibold text-sm">Barang</th>
                <th className="p-4 font-semibold text-sm">Tipe</th>
                <th className="p-4 font-semibold text-sm">Jumlah</th>
                <th className="p-4 font-semibold text-sm">Penanggung Jawab</th>
                <th className="p-4 font-semibold text-sm">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {goodsTransactions.map(tx => {
                const item = goods.find(g => g.id === tx.itemId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">{new Date(tx.date).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-medium text-slate-800">{item?.name || 'Barang Terhapus'}</td>
                    <td className="p-4">
                      {tx.type === 'IN' ? (
                        <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full w-fit">
                          <ArrowDown size={12} className="mr-1" /> Masuk
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full w-fit">
                          <ArrowUp size={12} className="mr-1" /> Keluar
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium">
                      {tx.type === 'IN' ? '+' : '-'}{tx.quantity} {item?.unit}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{tx.pic || '-'}</td>
                    <td className="p-4 text-sm text-slate-600">{tx.notes || '-'}</td>
                  </tr>
                );
              })}
              {goodsTransactions.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada riwayat transaksi</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) removeGoodsItem(itemToDelete);
        }}
        title="Hapus Barang"
      />


      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Tambah Barang Baru</h3>
            </div>
            <form onSubmit={handleAddItem} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Barang</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className={`w-full p-2.5 border ${exactMatch ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg focus:ring-2 outline-none`} />
                {exactMatch && (
                  <p className="text-red-500 text-xs mt-1 font-medium">Barang dengan nama ini sudah ada di sistem!</p>
                )}
                {similarGoods.length > 0 && (
                  <p className="text-slate-500 text-xs mt-1">Saran / Mirip: {similarGoods.map(g => g.name).join(', ')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <input required type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stok Awal</label>
                  <input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batas Minimum</label>
                  <input required type="number" min="0" value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                  <input required type="text" placeholder="Mis: Pcs, Kg" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" disabled={exactMatch} className={`px-4 py-2 text-white rounded-lg transition-colors ${exactMatch ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Simpan</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 pointer-events-none">
          <motion.div 
            drag 
            dragMomentum={false}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center cursor-move bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                Catat Barang {txForm.type === 'IN' ? 'Masuk' : 'Keluar'}
              </h3>
            </div>
            <form onSubmit={handleTransaction} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <span className="text-sm text-slate-500">Barang terpilih:</span>
                <p className="font-semibold text-slate-800">{goods.find(g => g.id === selectedItemId)?.name}</p>
                <p className="text-xs text-slate-500 mt-1">Stok saat ini: {goods.find(g => g.id === selectedItemId)?.stock} {goods.find(g => g.id === selectedItemId)?.unit}</p>
              </div>
              
              {txForm.type === 'OUT' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Teknisi / Penanggung Jawab</label>
                  <select 
                    required
                    value={txForm.pic} 
                    onChange={e => setTxForm({...txForm, pic: e.target.value})} 
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="" disabled>Pilih Teknisi</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.name}>{t.name} - {t.role}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
                <input 
                  required type="number" min="1" 
                  max={txForm.type === 'OUT' ? goods.find(g => g.id === selectedItemId)?.stock : undefined}
                  value={txForm.quantity} 
                  onChange={e => setTxForm({...txForm, quantity: Number(e.target.value)})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Referensi</label>
                <textarea 
                  required 
                  rows={3}
                  value={txForm.notes} 
                  onChange={e => setTxForm({...txForm, notes: e.target.value})} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" 
                />
              </div>
              <div className="pt-4 flex space-x-3 justify-end">
                <button type="button" onClick={() => setIsTxModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg transition-colors ${txForm.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
