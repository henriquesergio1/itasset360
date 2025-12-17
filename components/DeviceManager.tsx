
// ... existing imports
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Device, DeviceStatus, MaintenanceRecord, MaintenanceType, ActionType, ReturnChecklist, DeviceAccessory } from '../types';
import { Plus, Search, Edit2, Trash2, Smartphone, Monitor, Settings, Image as ImageIcon, FileText, Wrench, DollarSign, Paperclip, Link, Unlink, History, ArrowRight, Tablet, Hash, ScanBarcode, ExternalLink, ArrowUpRight, ArrowDownLeft, CheckSquare, Printer, CheckCircle, Plug, X, Layers, Square, Copy, Box, Ban, LayoutGrid, Eye, AlertTriangle, HardDrive, SmartphoneNfc, Sliders, MapPin } from 'lucide-react';
import ModelSettings from './ModelSettings';
import { generateAndPrintTerm } from '../utils/termGenerator';

const DeviceManager = () => {
  const { 
    devices, addDevice, updateDevice, deleteDevice, 
    users, models, brands, assetTypes, sims, sectors, accessoryTypes, customFields,
    maintenances, addMaintenance, deleteMaintenance,
    getHistory, settings,
    assignAsset, returnAsset 
  } = useData();
  const { user: currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewStatus, setViewStatus] = useState<DeviceStatus | 'ALL'>('ALL'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false); 
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ACCESSORIES' | 'FINANCIAL' | 'MAINTENANCE' | 'HISTORY'>('GENERAL');
  const [formData, setFormData] = useState<Partial<Device>>({ status: DeviceStatus.AVAILABLE, accessories: [], customData: {} });
  const [idType, setIdType] = useState<'TAG' | 'IMEI'>('TAG');
  const [newMaint, setNewMaint] = useState<Partial<MaintenanceRecord>>({ type: MaintenanceType.CORRECTIVE, cost: 0, invoiceUrl: '' });
  const [selectedAccType, setSelectedAccType] = useState('');

  const adminName = currentUser?.name || 'Sistema';

  const getModelDetails = (modelId?: string) => {
    const model = models.find(m => m.id === modelId);
    const brand = brands.find(b => b.id === model?.brandId);
    const type = assetTypes.find(t => t.id === model?.typeId);
    return { model, brand, type };
  };

  const filteredDevices = devices.filter(d => {
    if (viewStatus !== 'ALL' && d.status !== viewStatus) return false;
    const { model, brand } = getModelDetails(d.modelId);
    const searchString = `${model?.name} ${brand?.name} ${d.assetTag} ${d.imei || ''} ${d.pulsusId || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleAddMaintenance = () => {
    if (!newMaint.description || !newMaint.cost) return;
    const record: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        deviceId: editingId!,
        date: new Date().toISOString(),
        description: newMaint.description!,
        cost: Number(newMaint.cost),
        type: newMaint.type || MaintenanceType.CORRECTIVE,
        provider: newMaint.provider || 'Interno',
        invoiceUrl: newMaint.invoiceUrl
    };
    addMaintenance(record, adminName);
    setNewMaint({ type: MaintenanceType.CORRECTIVE, cost: 0, description: '', provider: '', invoiceUrl: '' });
  };

  const handleOpenModal = (device?: Device, viewOnly: boolean = false) => {
    setActiveTab('GENERAL');
    setIsViewOnly(viewOnly);
    if (device) {
      setEditingId(device.id);
      setFormData({ ...device, accessories: device.accessories || [], customData: device.customData || {} });
      setIdType(device.imei ? 'IMEI' : 'TAG');
    } else {
      setEditingId(null);
      setFormData({ status: DeviceStatus.AVAILABLE, purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: 0, accessories: [], customData: {} });
      setIdType('TAG');
    }
    setIsModalOpen(true);
  };

  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && formData.id) {
      updateDevice(formData as Device, adminName);
    } else {
      addDevice({ ...formData, id: Math.random().toString(36).substr(2, 9), currentUserId: null } as Device, adminName);
    }
    setIsModalOpen(false);
  };

  const deviceMaintenances = maintenances.filter(m => m.deviceId === editingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventário de Dispositivos</h1>
          <p className="text-gray-500 text-sm">Gerencie computadores, celulares e outros ativos.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsModelSettingsOpen(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors">
            <Settings size={18} /> Configurar Modelos
            </button>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
            <Plus size={18} /> Novo Dispositivo
            </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        <input type="text" placeholder="Buscar..." className="pl-10 w-full border rounded-lg py-2" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
            <tr>
              <th className="px-6 py-3">Modelo</th>
              <th className="px-6 py-3">Identificação</th>
              <th className="px-6 py-3">Localização</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Usuário</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map(d => {
              const { model, brand } = getModelDetails(d.modelId);
              const user = users.find(u => u.id === d.currentUserId);
              const sec = sectors.find(s => s.id === d.sectorId);
              return (
                <tr key={d.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{model?.name}</div>
                    <div className="text-xs text-gray-500">{brand?.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold">{d.assetTag}</div>
                    {d.imei && <div className="text-[10px] text-gray-400">IMEI: {d.imei}</div>}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="font-bold">{sec?.name || '-'}</div>
                    <div className="text-gray-500">{d.costCenter || 'S/ Cód'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${d.status === DeviceStatus.AVAILABLE ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-700">{user?.fullName || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(d)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                    <button onClick={() => deleteDevice(d.id, adminName, 'Exclusão manual')} className="text-red-500 hover:bg-red-50 p-1 rounded ml-1"><Trash2 size={16}/></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Dispositivo' : 'Novo Dispositivo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="flex border-b">
                {['GENERAL', 'ACCESSORIES', 'FINANCIAL', 'MAINTENANCE', 'HISTORY'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                        {tab === 'GENERAL' ? 'Geral' : tab === 'ACCESSORIES' ? 'Acessórios' : tab === 'FINANCIAL' ? 'Financeiro' : tab === 'MAINTENANCE' ? 'Manutenção' : 'Histórico'}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'GENERAL' && (
                  <form id="devForm" onSubmit={handleDeviceSubmit} className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo do Equipamento</label>
                         <select required className="w-full border rounded-lg p-2 bg-gray-50" value={formData.modelId} onChange={e => setFormData({...formData, modelId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {models.map(m => <option key={m.id} value={m.id}>{m.name} ({brands.find(b => b.id === m.brandId)?.name})</option>)}
                         </select>
                     </div>
                     <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                         <div className="flex gap-4">
                             <label className="flex items-center gap-2 text-sm font-bold cursor-pointer"><input type="radio" checked={idType === 'TAG'} onChange={() => setIdType('TAG')} /> Patrimônio</label>
                             <label className="flex items-center gap-2 text-sm font-bold cursor-pointer"><input type="radio" checked={idType === 'IMEI'} onChange={() => setIdType('IMEI')} /> IMEI (Móvel)</label>
                         </div>
                         <input required className="w-full border rounded-lg p-2 font-mono text-sm" placeholder={idType === 'TAG' ? 'TAG-001' : 'IMEI 15 dígitos'} value={formData.assetTag || ''} onChange={e => setFormData({...formData, assetTag: e.target.value, imei: idType === 'IMEI' ? e.target.value : undefined})} />
                     </div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número de Série</label><input required className="w-full border rounded-lg p-2 text-sm" value={formData.serialNumber || ''} onChange={e => setFormData({...formData, serialNumber: e.target.value})}/></div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Pulsus (MDM)</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.pulsusId || ''} onChange={e => setFormData({...formData, pulsusId: e.target.value})}/></div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Setor Atual</label>
                        <select className="w-full border rounded-lg p-2 text-sm" value={formData.sectorId} onChange={e => setFormData({...formData, sectorId: e.target.value})}>
                            <option value="">Selecione...</option>
                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Centro de Custo</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.costCenter || ''} onChange={e => setFormData({...formData, costCenter: e.target.value})}/></div>
                  </form>
                )}

                {activeTab === 'FINANCIAL' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data da Compra</label><input type="date" className="w-full border rounded-lg p-2 text-sm" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Pago (R$)</label><input type="number" step="0.01" className="w-full border rounded-lg p-2 text-sm" value={formData.purchaseCost || 0} onChange={e => setFormData({...formData, purchaseCost: parseFloat(e.target.value)})}/></div>
                        <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})}/></div>
                        <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nota Fiscal (Número)</label><input className="w-full border rounded-lg p-2 text-sm" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}/></div>
                    </div>
                )}

                {activeTab === 'MAINTENANCE' && (
                    <div className="space-y-6">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2"><Wrench size={16}/> Nova Manutenção</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-orange-700">Descrição</label>
                                    <input className="w-full border rounded p-2 text-sm" placeholder="Ex: Troca de Bateria" value={newMaint.description || ''} onChange={e => setNewMaint({...newMaint, description: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-orange-700">Custo (R$)</label>
                                    <input type="number" className="w-full border rounded p-2 text-sm" value={newMaint.cost} onChange={e => setNewMaint({...newMaint, cost: parseFloat(e.target.value)})}/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-orange-700">Prestador</label>
                                    <input className="w-full border rounded p-2 text-sm" value={newMaint.provider || ''} onChange={e => setNewMaint({...newMaint, provider: e.target.value})}/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-orange-700">Nota de Serviço / Link NF</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 border rounded p-2 text-sm" placeholder="URL ou Caminho do arquivo" value={newMaint.invoiceUrl || ''} onChange={e => setNewMaint({...newMaint, invoiceUrl: e.target.value})}/>
                                        <label className="bg-white border rounded px-3 flex items-center cursor-pointer hover:bg-gray-50"><Paperclip size={16}/><input type="file" className="hidden" onChange={e => setNewMaint({...newMaint, invoiceUrl: e.target.files?.[0]?.name})}/></label>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleAddMaintenance} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 shadow-md">Salvar Registro</button>
                        </div>
                        <div className="space-y-2">
                            {deviceMaintenances.map(m => (
                                <div key={m.id} className="bg-white border p-3 rounded-lg flex justify-between items-center text-sm">
                                    <div>
                                        <div className="font-bold">{m.description}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">{new Date(m.date).toLocaleDateString()} • {m.provider}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {m.invoiceUrl && <a href="#" onClick={e => { e.preventDefault(); alert('Abrindo nota: ' + m.invoiceUrl); }} className="text-blue-600 hover:text-blue-800" title="Ver Nota"><Paperclip size={16}/></a>}
                                        <div className="font-bold text-gray-700">R$ {m.cost.toFixed(2)}</div>
                                        <button onClick={() => deleteMaintenance(m.id, adminName)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                        {getHistory(editingId || '').map(log => (
                            <div key={log.id} className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</div>
                                <div className="font-bold text-gray-800 text-sm">{log.action}</div>
                                <div className="text-xs text-gray-600">{log.notes}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Por: {log.adminUser}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-200 font-bold text-gray-700 hover:bg-gray-300">Fechar</button>
                {['GENERAL', 'FINANCIAL'].includes(activeTab) && <button type="submit" form="devForm" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md">Salvar Dispositivo</button>}
            </div>
          </div>
        </div>
      )}

      {isModelSettingsOpen && <ModelSettings onClose={() => setIsModelSettingsOpen(false)} />}
    </div>
  );
};

export default DeviceManager;
