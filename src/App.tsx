import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { GoodsView } from './components/views/GoodsView';
import { EquipmentView } from './components/views/EquipmentView';
import { VehicleView } from './components/views/VehicleView';
import { TechnicianView } from './components/views/TechnicianView';
import { ExportView } from './components/views/ExportView';
import { UserManagementView } from './components/views/UserManagementView';
import { LoginView } from './components/views/LoginView';
import { BackButton } from './components/BackButton';
import { AppProvider, useAppContext } from './store';
import { Menu } from 'lucide-react';

function Dashboard() {
  const { currentUser, companies, navigateTo, goBack, canGoBack, navHistory, currentNavIndex } = useAppContext();
  const activeTab = navHistory[currentNavIndex];
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    navigateTo(tab);
    setIsSidebarOpen(false); // Close sidebar automatically when menu is selected
  };

  const appTitle = currentUser?.role === 'admin'
    ? companies.find(company => company.id === currentUser.companyId)?.name ?? 'Ku'
    : 'Ku';

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header to toggle sidebar */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <BackButton />
          <h1 className="ml-4 text-xl font-bold text-slate-800 capitalize">Stock Gudang{appTitle}</h1>
        </header>

        <div className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && <DashboardView onTabChange={handleTabChange} />}
          {activeTab === 'goods' && <GoodsView />}
          {activeTab === 'equipment' && <EquipmentView />}
          {activeTab === 'vehicles' && <VehicleView />}
          {activeTab === 'technicians' && <TechnicianView />}
          {activeTab === 'export' && <ExportView />}
          {activeTab === 'users' && <UserManagementView />}
        </div>
      </main>
    </div>
  );
}

function MainApp() {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <LoginView />;
  }

  return <Dashboard />;
}

export default function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
