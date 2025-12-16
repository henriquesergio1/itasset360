import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { SimCard, DeviceStatus } from '../types';
import { Plus, Search, Edit2, Trash2, Smartphone } from 'lucide-react';

const SimManager = () => {
  const { sims, addSim, updateSim, deleteSim, users } = useData();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SimCard>>({ status: DeviceStatus.AVAILABLE });

  const handleOpenModal = (sim?: SimCard) => {
    if (sim) {
      setEditingId(sim.id);
      setFormData(sim);
    } else {
      setEditingId(null);
      setFormData({ status: DeviceStatus.AVAILABLE });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adminName = currentUser?.name || 'Unknown';

    if (editingId && formData.id) {
      updateSim(formData as SimCard, adminName);
    } else {
      addSim({ ...formData, id: Math.random().toString(36).substr(2, 9), currentUserId: null } as SimCard, adminName);
    }
    setIsModalOpen(false);
  };

  const filteredSims = sims.filter(s => 
    s.phoneNumber.includes(searchTerm) || 
    s.iccid.includes(searchTerm) ||
    s.operator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Chips / SIMs</h1>
          <p className="text-gray-500 text-sm">Controle de linhas móveis e dados.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus size={18} /> Novo SIM
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por número, ICCID ou operadora..." 
          className="pl-10 w-full sm:w-96 border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Número</th>
                <th className="px-6 py-3">Operadora</th>
                <th className="px-6 py-3">ICCID</th>
                <th className="px-6 py-3">Plano</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSims.map((sim) => {
                const assignedUser = users.find(u => u.id === sim.currentUserId);
                return (
                  <tr key={sim.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{sim.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{sim.operator}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{sim.iccid}</td>
                    <td className="px-6 py-4">{sim.planDetails || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${sim.status === DeviceStatus.AVAILABLE ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {sim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignedUser ? assignedUser.fullName : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(sim)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => deleteSim(sim.id, currentUser?.name || 'Unknown')} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar SIM' : 'Novo SIM'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Linha</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="(00) 00000-0000"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operadora</label>
                <select className="w-full border rounded-lg p-2" value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Vivo">Vivo</option>
                    <option value="Claro">Claro</option>
                    <option value="Tim">Tim</option>
                    <option value="Oi">Oi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICCID</label>
                <input required type="text" className="w-full border rounded-lg p-2" value={formData.iccid || ''} onChange={e => setFormData({...formData, iccid: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes do Plano</label>
                <input type="text" className="w-full border rounded-lg p-2" value={formData.planDetails || ''} onChange={e => setFormData({...formData, planDetails: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
// Helper
const X = ({size}: {size: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default SimManager;