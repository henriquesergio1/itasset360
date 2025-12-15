import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User, UserSector } from '../types';
import { Plus, Search, Edit2, Trash2, Mail, MapPin, Briefcase } from 'lucide-react';

const UserManager = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ active: true });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData(user);
    } else {
      setEditingId(null);
      setFormData({ active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && formData.id) {
      updateUser(formData as User);
    } else {
      addUser({ ...formData, id: Math.random().toString(36).substr(2, 9) } as User);
    }
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Colaboradores</h1>
          <p className="text-gray-500 text-sm">Cadastro de usuários para vinculação de ativos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nome, email ou CPF..." 
          className="pl-10 w-full sm:w-96 border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{user.fullName}</h3>
                  <p className="text-xs text-gray-500">{user.jobTitle}</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleOpenModal(user)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                 <button onClick={() => deleteUser(user.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
               <div className="flex items-center gap-2">
                 <Briefcase size={14} className="text-gray-400" />
                 <span>{user.sector}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Mail size={14} className="text-gray-400" />
                 <span className="truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-2">
                 <MapPin size={14} className="text-gray-400" />
                 <span className="truncate">{user.address}</span>
               </div>
               <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs">
                 <div><span className="text-gray-400">CPF:</span> {user.cpf}</div>
                 <div><span className="text-gray-400">RG:</span> {user.rg}</div>
                 {user.pis && <div><span className="text-gray-400">PIS:</span> {user.pis}</div>}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input required type="email" className="w-full border rounded-lg p-2" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.jobTitle || ''} onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                  <select className="w-full border rounded-lg p-2" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value as UserSector})}>
                     {Object.values(UserSector).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input required type="text" className="w-full border rounded-lg p-2" value={formData.rg || ''} onChange={e => setFormData({...formData, rg: e.target.value})} />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIS (Opcional)</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.pis || ''} onChange={e => setFormData({...formData, pis: e.target.value})} />
                </div>
                 <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                  <input type="text" className="w-full border rounded-lg p-2" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({size}: {size: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default UserManager;