import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoodsItem, GoodsTransaction, 
  EquipmentItem, EquipmentLog, 
  VehicleItem, VehicleLog, VehicleNeed,
  Technician, User, Company
} from './types';
import { 
  apiLogin, apiFetchDashboard, apiGoods, apiGoodsTransactions, apiEquipment, 
  apiVehicles, apiTechnicians, apiCompanies, apiUsers, apiLogout 
} from './api/client';

interface AppState {
  users: User[];
  companies: Company[];
  currentUser: User | null;
  goods: GoodsItem[];
  goodsTransactions: GoodsTransaction[];
  equipment: EquipmentItem[];
  equipmentLogs: EquipmentLog[];
  vehicles: VehicleItem[];
  vehicleLogs: VehicleLog[];
  vehicleNeeds: VehicleNeed[];
  technicians: Technician[];
  loading: boolean;
  // Branch being monitored (used by pengawas to switch branches)
  selectedBranchId: string;
  // Navigation history
  navHistory: string[];
  currentNavIndex: number;
}

interface AppContextType extends AppState {
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  
  // Navigation
  navigateTo: (tab: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  
  // Goods Actions
  addGoodsItem: (item: Omit<GoodsItem, 'id' | 'adminId' | 'companyId'>) => Promise<void>;
  removeGoodsItem: (id: string) => Promise<void>;
  addGoodsTransaction: (transaction: Omit<GoodsTransaction, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  
  // Equipment Actions
  addEquipmentItem: (item: Omit<EquipmentItem, 'id' | 'status' | 'currentUser' | 'adminId' | 'companyId'>) => Promise<void>;
  removeEquipmentItem: (id: string) => Promise<void>;
  addEquipmentLog: (log: Omit<EquipmentLog, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  updateEquipmentCondition: (id: string, condition: EquipmentItem['condition']) => Promise<void>;
  
  // Vehicle Actions
  addVehicleItem: (item: Omit<VehicleItem, 'id' | 'status' | 'adminId' | 'companyId' | 'lastOilChangeOdometer' | 'lastServiceOdometer'>) => Promise<void>;
  removeVehicleItem: (id: string) => Promise<void>;
  addVehicleLog: (log: Omit<VehicleLog, 'id' | 'startDate' | 'endDate' | 'endOdometer' | 'status' | 'adminId' | 'companyId'>) => Promise<void>;
  finishVehicleTrip: (logId: string, endOdometer?: number) => Promise<void>;
  addVehicleNeed: (need: Omit<VehicleNeed, 'id' | 'date' | 'adminId' | 'companyId'>) => Promise<void>;
  updateVehicleStatus: (id: string, status: VehicleItem['status']) => Promise<void>;
  
  // Technician Actions
  addTechnician: (tech: Omit<Technician, 'id' | 'adminId' | 'companyId'>) => Promise<void>;
  removeTechnician: (id: string) => Promise<void>;
  
  // Company Actions
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  removeCompany: (id: string) => Promise<void>;
  toggleCompanyDisabled: (id: string, disabled: boolean) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Omit<Company, 'id'>>) => Promise<void>;
  
  // User Actions
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  toggleUserDisabled: (id: string, disabled: boolean) => Promise<void>;
  
  // Branch selection
  setSelectedBranchId: (id: string) => void;
}

const getInitialState = (): AppState => {
  const storedUser = localStorage.getItem('warehouse_user');
  const storedHistory = localStorage.getItem('navHistory');
  const storedIndex = localStorage.getItem('currentNavIndex');
  const storedBranchId = localStorage.getItem('selectedBranchId');
  
  return {
    users: [],
    companies: [],
    currentUser: storedUser ? JSON.parse(storedUser) : null,
    goods: [],
    goodsTransactions: [],
    equipment: [],
    equipmentLogs: [],
    vehicles: [],
    vehicleLogs: [],
    vehicleNeeds: [],
    technicians: [],
    loading: false,
    selectedBranchId: storedUser ? (JSON.parse(storedUser)?.companyId ?? '') : '',
    navHistory: storedHistory ? JSON.parse(storedHistory) : ['dashboard'],
    currentNavIndex: storedIndex ? parseInt(storedIndex, 10) : 0,
  };
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState());

  const saveNavState = (history: string[], index: number) => {
    localStorage.setItem('navHistory', JSON.stringify(history));
    localStorage.setItem('currentNavIndex', index.toString());
  };

  const setSelectedBranchId = async (id: string) => {
    localStorage.setItem('selectedBranchId', id);
    setState(prev => ({ ...prev, selectedBranchId: id }));
    await refreshData(id);
  };

  const refreshData = async (branchId?: string) => {
    if (!state.currentUser) return;
    try {
      setState(p => ({ ...p, loading: true }));
      const data = await apiFetchDashboard(branchId);
      setState(prev => ({
        ...prev,
        ...data,
        loading: false
      }));
    } catch (e) {
      console.error('Failed to refresh data', e);
      setState(p => ({ ...p, loading: false }));
    }
  };

  useEffect(() => {
    if (state.currentUser) {
      refreshData(state.selectedBranchId || undefined);
    }
  }, [state.currentUser]);

  const login = async (username: string, password?: string) => {
    try {
      const user = await apiLogin(username, password || '');
      // Pengawas default ke SEMUA CABANG ('') agar bisa memantau seluruh cabang.
      // Role lain memakai cabangnya sendiri.
      const defaultBranchId = user.role === 'pengawas' ? '' : (user.companyId ?? '');
      localStorage.setItem('selectedBranchId', defaultBranchId);
      setState(prev => ({ 
        ...prev, 
        currentUser: user,
        selectedBranchId: defaultBranchId,
        navHistory: ['dashboard'],
        currentNavIndex: 0,
      }));
      saveNavState(['dashboard'], 0);
      return true;
    } catch (e) {
      console.error('Login failed', e);
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('activeTab');
    localStorage.removeItem('navHistory');
    localStorage.removeItem('currentNavIndex');
    localStorage.removeItem('selectedBranchId');
    setState({
      users: [],
      companies: [],
      currentUser: null,
      goods: [],
      goodsTransactions: [],
      equipment: [],
      equipmentLogs: [],
      vehicles: [],
      vehicleLogs: [],
      vehicleNeeds: [],
      technicians: [],
      loading: false,
      selectedBranchId: '',
      navHistory: ['dashboard'],
      currentNavIndex: 0,
    });
  };

  const navigateTo = (tab: string) => {
    setState(prev => {
      // If navigating to same tab, do nothing
      if (prev.navHistory[prev.currentNavIndex] === tab) {
        return prev;
      }
      
      // Truncate history after current index (when going back then navigating somewhere new)
      const newHistory = prev.navHistory.slice(0, prev.currentNavIndex + 1);
      newHistory.push(tab);
      const newIndex = newHistory.length - 1;
      
      saveNavState(newHistory, newIndex);
      return {
        ...prev,
        navHistory: newHistory,
        currentNavIndex: newIndex,
      };
    });
  };

  const goBack = () => {
    setState(prev => {
      if (prev.currentNavIndex <= 0) return prev;
      
      const newIndex = prev.currentNavIndex - 1;
      saveNavState(prev.navHistory, newIndex);
      return {
        ...prev,
        currentNavIndex: newIndex,
      };
    });
  };

  const canGoBack = state.currentNavIndex > 0;

  // ---- Goods ----
  const addGoodsItem = async (item: any) => {
    await apiGoods.create(item);
    await refreshData();
  };
  const removeGoodsItem = async (id: string) => {
    await apiGoods.delete(id);
    await refreshData();
  };
  const addGoodsTransaction = async (tx: any) => {
    await apiGoodsTransactions.create(tx);
    await refreshData();
  };

  // ---- Equipment ----
  const addEquipmentItem = async (item: any) => {
    await apiEquipment.create(item);
    await refreshData();
  };
  const removeEquipmentItem = async (id: string) => {
    await apiEquipment.delete(id);
    await refreshData();
  };
  const addEquipmentLog = async (log: any) => {
    await apiEquipment.logCreate(log);
    await refreshData();
  };
  const updateEquipmentCondition = async (id: string, condition: any) => {
    await apiEquipment.updateCondition(id, condition);
    await refreshData();
  };

  // ---- Vehicles ----
  const addVehicleItem = async (item: any) => {
    await apiVehicles.create(item);
    await refreshData();
  };
  const removeVehicleItem = async (id: string) => {
    await apiVehicles.delete(id);
    await refreshData();
  };
  const addVehicleLog = async (log: any) => {
    await apiVehicles.logCreate(log);
    await refreshData();
  };
  const finishVehicleTrip = async (logId: string, endOdometer?: number) => {
    await apiVehicles.finishTrip(logId, endOdometer);
    await refreshData();
  };
  const addVehicleNeed = async (need: any) => {
    await apiVehicles.needCreate(need);
    await refreshData();
  };
  const updateVehicleStatus = async (id: string, status: any) => {
    await apiVehicles.updateStatus(id, status);
    await refreshData();
  };

  // ---- Technicians ----
  const addTechnician = async (tech: any) => {
    await apiTechnicians.create(tech);
    await refreshData();
  };
  const removeTechnician = async (id: string) => {
    await apiTechnicians.delete(id);
    await refreshData();
  };

  // ---- Companies ----
  const addCompany = async (company: any) => {
    try {
      await apiCompanies.create(company);
      await refreshData();
    } catch (e: any) {
      alert(`Gagal menambah perusahaan: ${e.message}`);
    }
  };
  const removeCompany = async (id: string) => {
    await apiCompanies.delete(id);
    await refreshData();
  };
  const toggleCompanyDisabled = async (id: string, disabled: boolean) => {
    await apiCompanies.toggleDisabled(id, disabled);
    await refreshData();
  };
  const updateCompany = async (id: string, updates: any) => {
    await apiCompanies.update(id, updates);
    await refreshData();
  };

  // ---- Users ----
  const addUser = async (user: any) => {
    await apiUsers.create(user);
    await refreshData();
  };
  const updateUser = async (id: string, updates: any) => {
    await apiUsers.update(id, updates);
    await refreshData();
  };
  const removeUser = async (id: string) => {
    await apiUsers.delete(id);
    await refreshData();
  };
  const toggleUserDisabled = async (id: string, disabled: boolean) => {
    await apiUsers.toggleDisabled(id, disabled);
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login, logout, refreshData,
      navigateTo, goBack, canGoBack,
      addGoodsItem, removeGoodsItem, addGoodsTransaction,
      addEquipmentItem, removeEquipmentItem, addEquipmentLog, updateEquipmentCondition,
      addVehicleItem, removeVehicleItem, addVehicleLog, finishVehicleTrip, addVehicleNeed, updateVehicleStatus,
      addTechnician, removeTechnician,
      addCompany, removeCompany, toggleCompanyDisabled, updateCompany,
      addUser, updateUser, removeUser, toggleUserDisabled,
      setSelectedBranchId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
