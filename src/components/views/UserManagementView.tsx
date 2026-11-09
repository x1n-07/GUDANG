import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../store';
import { Plus, X, Building, User as UserIcon, Phone, Search, Trash2, Key } from 'lucide-react';
import { UserRole, Company, User } from '../../types';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

export const UserManagementView: React.FC = () => {
  const {
    users,
    companies,
    addUser,
    updateUser,
    addCompany,
    updateCompany,
    removeUser,
    removeCompany,
    toggleUserDisabled,
    toggleCompanyDisabled,
    currentUser
  } = useAppContext();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    username: '',
    password: '',
    role: 'admin',
    companyId: companies[0]?.id ?? '',
    contact: '',
    disabled: false
  });
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id'>>({
    name: '',
    disabled: false
  });

  useEffect(() => {
    if (!newUser.companyId && companies.length > 0) {
      setNewUser(prev => ({ ...prev, companyId: companies[0].id }));
    }
  }, [companies]);

  const getCompanyName = (companyId?: string) => companies.find(company => company.id === companyId)?.name || '-';

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.companyId) {
      alert('Silakan pilih perusahaan atau cabang.');
      return;
    }

    if (editingUserId) {
      if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase() && u.id !== editingUserId)) {
        alert('Username sudah terdaftar!');
        return;
      }
      updateUser(editingUserId, newUser);
      setEditingUserId(null);
      setIsAddUserModalOpen(false);
      setNewUser({ name: '', username: '', password: '', role: 'admin', companyId: companies[0]?.id ?? '', contact: '', disabled: false });
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      alert('Username sudah terdaftar!');
      return;
    }

    addUser(newUser);
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', username: '', password: '', role: 'admin', companyId: companies[0]?.id ?? '', contact: '', disabled: false });
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) {
      alert('Nama perusahaan / cabang tidak boleh kosong.');
      return;
    }

    if (editingCompanyId) {
      updateCompany(editingCompanyId, newCompany);
      setEditingCompanyId(null);
    } else {
      addCompany(newCompany);
    }

    setIsAddCompanyModalOpen(false);
    setNewCompany({ name: '', disabled: false });
  };

  const filteredUsers = users.filter(user =>
    user.role !== 'superadmin' &&
    (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCompanyName(user.companyId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="p-6 text-center text-slate-500">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Perusahaan / Cabang</h1>
          <p className="text-slate-500 mt-1">Kelola perusahaan, cabang, dan akun login dengan penugasan perusahaan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingCompanyId(null);
              setNewCompany({ name: '', disabled: false });
              setIsAddCompanyModalOpen(true);
            }}
            className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Building size={20} />
            <span>Tambah Perusahaan / Cabang</span>
          </button>
          <button
            onClick={() => {
              setEditingUserId(null);
              setNewUser({ name: '', username: '', password: '', role: 'admin', companyId: companies[0]?.id ?? '', contact: '', disabled: false });
              setIsAddUserModalOpen(true);
            }}
            className="w-full sm:w-auto flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>Tambah Akun Login</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari admin, perusahaan, username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Perusahaan / Cabang</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.length > 0 ? (
                companies.map(company => (
                  <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-800">{company.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${company.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {company.disabled ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCompanyId(company.id);
                          setNewCompany({ name: company.name, disabled: company.disabled ?? false });
                          setIsAddCompanyModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Edit Perusahaan"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompanyDisabled(company.id, !company.disabled)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${company.disabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-amber-700 hover:bg-yellow-200'}`}
                      >
                        {company.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanyToDelete(company.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex"
                        title="Hapus Perusahaan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada perusahaan atau cabang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Daftar Akun Login</h2>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama PIC</th>
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Password</th>
                <th className="px-6 py-4 font-semibold">Perusahaan / Cabang</th>
                <th className="px-6 py-4 font-semibold">Kontak</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.username}</td>
                    <td className="px-6 py-4 text-slate-600">{user.password ?? '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{getCompanyName(user.companyId)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.contact ? (
                        <span className="inline-flex items-center space-x-1">
                          <Phone size={14} className="text-slate-400" />
                          <span>{user.contact}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user.disabled ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setNewUser({
                            name: user.name,
                            username: user.username,
                            password: user.password ?? '',
                            role: user.role,
                            companyId: user.companyId ?? '',
                            contact: user.contact ?? '',
                            disabled: user.disabled ?? false
                          });
                          setIsAddUserModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Edit Akun"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUserDisabled(user.id, !user.disabled)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${user.disabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-amber-700 hover:bg-yellow-200'}`}
                      >
                        {user.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                      <button
                        onClick={() => setItemToDelete(user.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex"
                        title="Hapus Akun"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada akun login ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {itemToDelete && (
          <ConfirmDeleteModal
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={() => {
              if (itemToDelete) removeUser(itemToDelete);
            }}
            title="Hapus Akun Login"
          />
        )}
        {companyToDelete && (
          <ConfirmDeleteModal
            isOpen={!!companyToDelete}
            onClose={() => setCompanyToDelete(null)}
            onConfirm={() => {
              if (companyToDelete) removeCompany(companyToDelete);
            }}
            title="Hapus Perusahaan / Cabang"
          />
        )}

        {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                  <Key className="text-blue-600" size={20} />
                  <span>{editingUserId ? 'Edit Akun Login' : 'Tambah Akun Login'}</span>
                </h3>
                <button onClick={() => {
                  setIsAddUserModalOpen(false);
                  setEditingUserId(null);
                  setNewUser({ name: '', username: '', password: '', role: 'admin', companyId: companies[0]?.id ?? '', contact: '', disabled: false });
                }} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username Login</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input
                        required
                        type="text"
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Cth: admin_budi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password {editingUserId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                    </label>
                    <input
                      required={!editingUserId}
                      type="password"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder={editingUserId ? "••••••••" : ""}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama PIC (Penanggung Jawab)</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Cth: Budi Santoso"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
                    <select
                      required
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="pengawas">Pengawas</option>
                      <option value="teknisi">Teknisi</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={newUser.disabled}
                        onChange={e => setNewUser({ ...newUser, disabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                      />
                      <span>Nonaktifkan akun</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Perusahaan / Cabang</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                    <select
                      required
                      value={newUser.companyId}
                      onChange={e => setNewUser({ ...newUser, companyId: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>Pilih perusahaan / cabang</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kontak / No. Telepon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={newUser.contact}
                      onChange={e => setNewUser({ ...newUser, contact: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Cth: 08123456789"
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3 justify-end border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {editingUserId ? 'Update Akun' : 'Tambah Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddCompanyModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                  <Building className="text-blue-600" size={20} />
                  <span>{editingCompanyId ? 'Edit Perusahaan / Cabang' : 'Tambah Perusahaan / Cabang'}</span>
                </h3>
                <button onClick={() => {
                  setIsAddCompanyModalOpen(false);
                  setEditingCompanyId(null);
                  setNewCompany({ name: '', disabled: false });
                }} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCompany} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan / Cabang</label>
                  <input
                    required
                    type="text"
                    value={newCompany.name}
                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Cth: PT Logistik Sejahtera / Cabang Jakarta"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="company-disabled"
                    type="checkbox"
                    checked={newCompany.disabled}
                    onChange={e => setNewCompany({ ...newCompany, disabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                  />
                  <label htmlFor="company-disabled" className="text-sm font-medium text-slate-700">
                    Nonaktifkan perusahaan / cabang
                  </label>
                </div>

                <div className="pt-4 flex space-x-3 justify-end border-t border-slate-100">
                  <button type="button" onClick={() => {
                    setIsAddCompanyModalOpen(false);
                    setEditingCompanyId(null);
                    setNewCompany({ name: '', disabled: false });
                  }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {editingCompanyId ? 'Update Perusahaan' : 'Simpan Perusahaan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
