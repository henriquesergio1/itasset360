import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Device, DeviceType, DeviceStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Smartphone, Monitor, Server, Laptop } from 'lucide-react';

const DeviceIcon = ({ type }: { type: DeviceType }) => {
  switch (type) {
    case DeviceType.SMARTPHONE: return <Smartphone className="w-5 h-5 text-gray-500" />;
    case DeviceType.NOTEBOOK: return <Laptop className="w-5 h-5 text-gray-500" />;
    case DeviceType.SERVER: return <Server className="w-5 h-5 text-gray-500" />;
    default: return <Monitor className="w-5 h-5 text-gray-500" />;
  }
};

const DeviceManager = () => {
  const { devices, addDevice, updateDevice, deleteDevice, users } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Device>>({
    type: DeviceType.NOTEBOOK,
    status: DeviceStatus.AVAILABLE
  });

  const handleOpenModal = (device?: Device) => {
    if (device) {
      setEditingId(device.id);
      setFormData(device);
    } else {
      setEditingId(null);
      setFormData({ type: DeviceType.NOTEBOOK, status: DeviceStatus.AVAILABLE, purchaseDate: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && formData.id) {
      updateDevice(formData as Device);
    } else {
      addDevice({ ...formData, id: Math.random().toString(36).substr(2, 9), currentUserId: null } as Device);
    }
    setIsModalOpen(false);
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.assetTag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventário de Dispositivos</h1>
          <p className="text-gray-500 text-sm">Gerencie computadores, celulares e outros ativos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
          <Plus size={18} /> Novo Dispositivo
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nome, modelo ou patrimônio..." 
          className="pl-10 w-full sm:w-96 border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Equipamento</th>
                <th className="px-6 py-3">Patrimônio</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Usuário Atual</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const currentUser = users.find(u => u.id === device.currentUserId);
                return (
                  <tr key={device.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded">
                          <DeviceIcon type={device.type} />
                        </div>
                        {device.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{device.name}</div>
                      <div className="text-xs text-gray-400">{device.brand} - {device.model}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">{device.assetTag}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${device.status === DeviceStatus.AVAILABLE ? 'bg-green-100 text-green-800' : 
                          device.status === DeviceStatus.IN_USE ? 'bg-blue-100 text-blue-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {currentUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {currentUser.fullName.charAt(0)}
                          </div>
                          <span>{currentUser.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(device)} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteDevice(device.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDevices.length === 0 && (
            <div className="p-8 text-center text-gray-400">Nenhum dispositivo encontrado.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Dispositivo' : 'Novo Dispositivo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Equipamento</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Dell Latitude 5420"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select className="w-full border rounded-lg p-2 text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DeviceType})}>
                    {Object.values(DeviceType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.model || ''} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.serialNumber || ''} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patrimônio (Tag)</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={formData.assetTag || ''} onChange={e => setFormData({...formData, assetTag: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Compra</label>
                  <input type="date" className="w-full border rounded-lg p-2 text-sm" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border rounded-lg p-2 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as DeviceStatus})}>
                    {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for X icon
const X = ({size}: {size: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default DeviceManager;