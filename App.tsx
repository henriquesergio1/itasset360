import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Users, Repeat, History, Settings, LogOut, Menu, X, Cpu } from 'lucide-react';

// Pages imports
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import SimManager from './components/SimManager';
import UserManager from './components/UserManager';
import Operations from './components/Operations';

const SidebarLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <NavLink to={to} className={`flex items-center space-x-3 px-6 py-3 transition-colors ${isActive ? 'bg-blue-900 text-white border-l-4 border-blue-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Cpu className="text-white h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">IT Asset 360</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 flex flex-col space-y-1">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/devices" icon={Smartphone} label="Dispositivos" />
          <SidebarLink to="/sims" icon={Cpu} label="Chips / SIMs" />
          <SidebarLink to="/users" icon={Users} label="Usuários" />
          <SidebarLink to="/operations" icon={Repeat} label="Entrega/Devolução" />
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="flex items-center space-x-3 text-gray-400 hover:text-white cursor-pointer transition-colors">
            <LogOut size={20} />
            <span>Sair</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10 h-16 flex items-center justify-between px-6">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">Administrador TI</p>
              <p className="text-xs text-gray-500">Matriz - São Paulo</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<DeviceManager />} />
          <Route path="/sims" element={<SimManager />} />
          <Route path="/users" element={<UserManager />} />
          <Route path="/operations" element={<Operations />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;