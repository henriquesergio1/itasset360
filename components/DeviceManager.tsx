import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Device, DeviceStatus, MaintenanceRecord, MaintenanceType, ActionType } from '../types';
import { Plus, Search, Edit2, Trash2, Smartphone, Monitor, Settings, Image as ImageIcon, FileText, Wrench, DollarSign, Paperclip, Link, Unlink, History, ArrowRight, Tablet, Hash, ScanBarcode, ExternalLink } from 'lucide-react';
import ModelSettings from './ModelSettings';

const DeviceManager = () => {
  const { 
    devices, addDevice, updateDevice, deleteDevice, 
    users, models, brands, assetTypes, sims, sectors,
    maintenances, addMaintenance, deleteMaintenance,
    getHistory // Função para pegar logs
  } = useData();
  const { user: currentUser } = useAuth();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'FINANCIAL' | 'MAINTENANCE' | 'HISTORY'>('GENERAL');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Device>>({
    status: DeviceStatus.AVAILABLE
  });
  
  // New State for ID Type (Tag vs IMEI)
  const [idType, setIdType] = useState<'TAG' | 'IMEI'>('TAG');

  // Maintenance Form State
  const [newMaint, setNewMaint] = useState<Partial<MaintenanceRecord>>({ type: MaintenanceType.CORRECTIVE, cost: 0 });

  const adminName = currentUser?.name || 'Unknown User';

  // --- Handlers ---

  const handleOpenModal = (device?: Device) => {
    setActiveTab('GENERAL');
    if (device) {
      setEditingId(device.id);
      setFormData(device);
      // Se tiver IMEI preenchido, assume que é do tipo IMEI
      if (device.imei) {
          setIdType('IMEI');
      } else {
          setIdType('TAG');
      }
    } else {
      setEditingId(null);
      setFormData({ 
        status: DeviceStatus.AVAILABLE, 
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: 0
      });
      setIdType('TAG');
    }
    setIsModalOpen(true);
  };

  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de IMEI
    if (idType === 'IMEI') {
        const currentVal = formData.assetTag || '';
        // Remove não numéricos para testar
        const numericVal = currentVal.replace(/\D/g, '');
        
        if (numericVal.length !== 15) {
            alert('ERRO: Para o tipo IMEI, o campo deve conter exatamente 15 dígitos numéricos.');
            return;
        }

        // Salva o valor validado tanto no imei quanto no assetTag (para visualização padrão)
        formData.imei = numericVal;
        formData.assetTag = numericVal; 
    } else {
        // Se for TAG, limpa o IMEI para não gerar confusão
        formData.imei = undefined;
    }

    if (editingId && formData.id) {
      updateDevice(formData as Device, adminName);
    } else {
      addDevice({ 
        ...formData, 
        id: Math.random().toString(36).substr(2, 9), 
        currentUserId: null 
      } as Device, adminName);
    }
    setIsModalOpen(false);
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      
      if (idType === 'IMEI') {
          // Permite apenas números
          val = val.replace(/\D/g, '');
          // Limita a 15 caracteres
          if (val.length > 15) return;
      }
      
      setFormData({ ...formData, assetTag: val });
  };

  const handleAddMaintenance = () => {
    if (!newMaint.description || !newMaint.cost) return;
    const record: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        deviceId: editingId!,
        date: new Date().toISOString(),
        description: newMaint.description,
        cost: Number(newMaint.cost),
        type: newMaint.type || MaintenanceType.CORRECTIVE,
        provider: newMaint.provider || 'Interno'
    };
    addMaintenance(record, adminName);
    setNewMaint({ type: MaintenanceType.CORRECTIVE, cost: 0, description: '', provider: '' });
  };

  // --- Helpers ---

  const getModelDetails = (modelId?: string) => {
    const model = models.find(m => m.id === modelId);
    const brand = brands.find(b => b.id === model?.brandId);
    const type = assetTypes.find(t => t.id === model?.typeId);
    return { model, brand, type };
  };

  const filteredDevices = devices.filter(d => {
    const { model, brand } = getModelDetails(d.modelId);
    const searchString = `${model?.name} ${brand?.name} ${d.assetTag} ${d.imei || ''} ${d.pulsusId || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Sim Linking Options (Available Sims + Currently Linked Sim)
  const availableSims = sims.filter(s => s.status === DeviceStatus.AVAILABLE || s.id === formData.linkedSimId);

  // Maintenance Calculations
  const deviceMaintenances = maintenances.filter(m => m.deviceId === editingId);
  const totalMaintenanceCost = deviceMaintenances.reduce((acc, curr) => acc + curr.cost, 0);

  // History Logs
  const deviceHistory = editingId ? getHistory(editingId) : [];

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

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por modelo, marca, patrimônio, IMEI ou Pulsus ID..." 
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
                <th className="px-6 py-3">Modelo / Imagem</th>
                <th className="px-6 py-3">Identificação</th>
                <th className="px-6 py-3">Localização</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Usuário Atual</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const assignedUser = users.find(u => u.id === device.currentUserId);
                const { model, brand, type } = getModelDetails(device.modelId);
                const sectorName = sectors.find(s => s.id === device.sectorId)?.name;

                return (
                  <tr key={device.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-gray-100 border flex items-center justify-center overflow-hidden shrink-0">
                           {model?.imageUrl ? <img src={model.imageUrl} alt="" className="h-full w-full object-cover"/> : <ImageIcon size={20} className="text-gray-400"/>}
                        </div>
                        <div>
                            <span className="font-medium text-gray-900 block">{model?.name || 'Modelo Desconhecido'}</span>
                            <span className="text-xs text-gray-400 block">{brand?.name} • {type?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                          {device.imei ? (
                              <div className="text-gray-700 flex items-center gap-1">
                                  <Hash size={12}/> <span className="font-mono">{device.imei}</span> (IMEI)
                              </div>
                          ) : (
                              <div className="font-mono text-gray-600 flex items-center gap-1">
                                  <ScanBarcode size={12}/> <span className="font-bold">{device.assetTag}</span>
                              </div>
                          )}
                          <div className="text-gray-500">SN: {device.serialNumber}</div>
                          {device.pulsusId && <div className="text-blue-600 font-medium">ID Pulsus: {device.pulsusId}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                            {sectorName ? <div className="font-semibold">{sectorName}</div> : '-'}
                            {device.costCenter && <div>Cód: {device.costCenter}</div>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                        ${device.status === DeviceStatus.AVAILABLE ? 'bg-green-100 text-green-800' : 
                          device.status === DeviceStatus.IN_USE ? 'bg-blue-100 text-blue-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {assignedUser.fullName.charAt(0)}
                          </div>
                          <span className="truncate max-w-[100px]">{assignedUser.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {device.pulsusId && (
                            <a 
                                href={`https://app.pulsus.mobi/devices/${device.pulsusId}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-purple-600 hover:bg-purple-50 p-1 rounded transition-colors"
                                title="Abrir no MDM Pulsus"
                            >
                                <ExternalLink size={16} />
                            </a>
                        )}
                        <button onClick={() => handleOpenModal(device)} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteDevice(device.id, adminName)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={16} /></button>
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

      {/* === MAIN DEVICE MODAL === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Dispositivo' : 'Novo Dispositivo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b shrink-0 overflow-x-auto">
                <button onClick={() => setActiveTab('GENERAL')} className={`flex-1 min-w-[120px] py-3 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'GENERAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Dados Gerais</button>
                <button onClick={() => setActiveTab('FINANCIAL')} className={`flex-1 min-w-[120px] py-3 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'FINANCIAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Financeiro & Compra</button>
                {editingId && (
                    <>
                        <button onClick={() => setActiveTab('MAINTENANCE')} className={`flex-1 min-w-[120px] py-3 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'MAINTENANCE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Manutenções ({deviceMaintenances.length})</button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 min-w-[120px] py-3 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'HISTORY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Histórico & Logs</button>
                    </>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                
                {/* --- TAB: GENERAL --- */}
                {activeTab === 'GENERAL' && (
                    <form id="deviceForm" onSubmit={handleDeviceSubmit} className="space-y-4">
                        <div className="flex items-start gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
                           {formData.modelId && (
                               <div className="h-24 w-24 bg-white rounded border flex items-center justify-center overflow-hidden shrink-0">
                                   {models.find(m => m.id === formData.modelId)?.imageUrl ? 
                                     <img src={models.find(m => m.id === formData.modelId)?.imageUrl} className="h-full w-full object-cover" /> :
                                     <ImageIcon className="text-gray-300" />
                                   }
                               </div>
                           )}
                           <div className="flex-1">
                               <label className="block text-sm font-medium text-gray-700 mb-1">Modelo do Equipamento</label>
                               <select required className="w-full border rounded-lg p-2" value={formData.modelId || ''} onChange={e => setFormData({...formData,modelId: e.target.value})}>
                                   <option value="">Selecione o Modelo...</option>
                                   {models.map(m => (
                                       <option key={m.id} value={m.id}>{m.name} ({brands.find(b => b.id === m.brandId)?.name})</option>
                                   ))}
                               </select>
                               <p className="text-xs text-gray-500 mt-1">Configure novos modelos no menu "Configurar Modelos".</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* CAMPO DE IDENTIFICAÇÃO UNIFICADO */}
                            <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Identificação</label>
                                <div className="flex gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border hover:border-blue-400 transition-colors">
                                        <input type="radio" name="idType" checked={idType === 'TAG'} onChange={() => setIdType('TAG')} className="text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-gray-700">Hostname / Tag (Patrimônio)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border hover:border-blue-400 transition-colors">
                                        <input type="radio" name="idType" checked={idType === 'IMEI'} onChange={() => setIdType('IMEI')} className="text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-gray-700">IMEI (Dispositivo Móvel)</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-800 mb-1">
                                        {idType === 'IMEI' ? 'Número do IMEI (15 dígitos)' : 'Código do Patrimônio / Hostname'}
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full border rounded-lg p-2 font-mono text-gray-800" 
                                        value={formData.assetTag || ''} 
                                        onChange={handleIdChange}
                                        maxLength={idType === 'IMEI' ? 15 : undefined}
                                        placeholder={idType === 'IMEI' ? 'Ex: 356988012345678' : 'Ex: NOTE-TI-001'}
                                    />
                                    {idType === 'IMEI' && (
                                        <p className="text-xs text-blue-600 mt-1">O campo aceita apenas números.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série (SN)</label>
                                <input required type="text" className="w-full border rounded-lg p-2" value={formData.serialNumber || ''} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Tablet size={14}/> ID Pulsus (MDM)
                                </label>
                                <input type="text" className="w-full border rounded-lg p-2" value={formData.pulsusId || ''} onChange={e => setFormData({...formData, pulsusId: e.target.value})} placeholder="Ex: 10293" />
                            </div>

                            <div className="col-span-2 border-t pt-2 mt-2">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Localização & Setor do Ativo</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Setor do Equipamento</label>
                                        <select className="w-full border rounded-lg p-2" value={formData.sectorId || ''} onChange={e => setFormData({...formData, sectorId: e.target.value})}>
                                            <option value="">Selecione o setor...</option>
                                            {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Código do Setor (Centro de Custo)</label>
                                        <input type="text" className="w-full border rounded-lg p-2" value={formData.costCenter || ''} onChange={e => setFormData({...formData, costCenter: e.target.value})} placeholder="Ex: CC-1020" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full border rounded-lg p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as DeviceStatus})}>
                                    {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            {/* SIM Link Logic */}
                            {formData.modelId && (() => {
                                const m = models.find(x => x.id === formData.modelId);
                                const t = assetTypes.find(x => x.id === m?.typeId);
                                const isMobile = t?.name.toLowerCase().includes('phone') || t?.name.toLowerCase().includes('celular') || t?.name.toLowerCase().includes('tablet');
                                
                                if (isMobile) {
                                    return (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                                <Link size={14}/> Vincular Chip (SIM)
                                            </label>
                                            <select 
                                                className="w-full border rounded-lg p-2"
                                                value={formData.linkedSimId || ''}
                                                onChange={e => setFormData({...formData, linkedSimId: e.target.value || null})}
                                            >
                                                <option value="">Sem chip vinculado</option>
                                                {availableSims.map(s => (
                                                    <option key={s.id} value={s.id}>{s.phoneNumber} ({s.operator})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )
                                }
                                return null;
                            })()}
                        </div>
                    </form>
                )}

                {/* --- TAB: FINANCIAL --- */}
                {activeTab === 'FINANCIAL' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
                                <input type="date" className="w-full border rounded-lg p-2" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago (R$)</label>
                                <input type="number" step="0.01" className="w-full border rounded-lg p-2" value={formData.purchaseCost || 0} onChange={e => setFormData({...formData, purchaseCost: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                                <input type="text" className="w-full border rounded-lg p-2" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal (Nº)</label>
                                <input type="text" className="w-full border rounded-lg p-2" value={formData.invoiceNumber || ''} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} />
                            </div>
                        </div>
                        
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Anexo da Nota Fiscal</label>
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
                                    <Paperclip size={16}/> Anexar Arquivo
                                    <input type="file" className="hidden" onChange={() => alert('Em produção, isso enviaria o arquivo para o servidor.')} />
                                </label>
                                {formData.purchaseInvoiceUrl ? (
                                    <span className="text-sm text-blue-600 underline cursor-pointer">Ver nota fiscal atual</span>
                                ) : (
                                    <span className="text-xs text-gray-400">Nenhum arquivo anexado.</span>
                                )}
                            </div>
                        </div>
                     </div>
                )}

                {/* --- TAB: MAINTENANCE --- */}
                {activeTab === 'MAINTENANCE' && (
                    <div className="space-y-6">
                        {/* KPI */}
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="text-orange-900 font-bold">Custo Total de Manutenção</h4>
                                <p className="text-sm text-orange-700">Soma de todas as ordens de serviço</p>
                            </div>
                            <div className="text-2xl font-bold text-orange-600">
                                R$ {totalMaintenanceCost.toFixed(2)}
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                             {deviceMaintenances.map(m => (
                                 <div key={m.id} className="bg-white border p-3 rounded-lg flex justify-between items-start">
                                     <div>
                                         <div className="flex items-center gap-2">
                                             <span className="font-bold text-gray-700">{m.type}</span>
                                             <span className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString()}</span>
                                         </div>
                                         <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                                         <p className="text-xs text-gray-500 mt-1">Prestador: {m.provider}</p>
                                     </div>
                                     <div className="text-right">
                                         <span className="font-bold text-gray-800 block">R$ {m.cost.toFixed(2)}</span>
                                         <button onClick={() => deleteMaintenance(m.id, adminName)} className="text-xs text-red-500 hover:underline mt-2">Remover</button>
                                     </div>
                                 </div>
                             ))}
                             {deviceMaintenances.length === 0 && <p className="text-center text-gray-400 py-4">Nenhuma manutenção registrada.</p>}
                        </div>

                        {/* Add New Form */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Wrench size={16}/> Nova Manutenção</h5>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <select className="border p-2 rounded" value={newMaint.type} onChange={e => setNewMaint({...newMaint, type: e.target.value as MaintenanceType})}>
                                    {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="number" placeholder="Custo (R$)" className="border p-2 rounded" value={newMaint.cost || ''} onChange={e => setNewMaint({...newMaint, cost: parseFloat(e.target.value)})}/>
                                <input type="text" placeholder="Prestador de Serviço" className="border p-2 rounded w-full col-span-2" value={newMaint.provider || ''} onChange={e => setNewMaint({...newMaint, provider: e.target.value})}/>
                                <textarea placeholder="Descrição do serviço realizado..." className="border p-2 rounded w-full col-span-2" rows={2} value={newMaint.description || ''} onChange={e => setNewMaint({...newMaint, description: e.target.value})}></textarea>
                            </div>
                            <button type="button" onClick={handleAddMaintenance} className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">Adicionar Registro</button>
                        </div>
                    </div>
                )}
                
                {/* --- TAB: HISTORY --- */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History size={20} className="text-blue-600" />
                            <h4 className="font-bold text-gray-800">Linha do Tempo Completa</h4>
                        </div>
                        
                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                            {deviceHistory.map((log) => (
                                <div key={log.id} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white
                                        ${log.action === ActionType.CHECKOUT ? 'bg-blue-500' : 
                                          log.action === ActionType.CHECKIN ? 'bg-green-500' :
                                          log.action === ActionType.MAINTENANCE_START ? 'bg-amber-500' :
                                          'bg-gray-400'
                                        }`}></div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{new Date(log.timestamp).toLocaleString()}</span>
                                            <h5 className="font-bold text-gray-900 mt-1">{log.action}</h5>
                                            <p className="text-sm text-gray-600 mt-1">{log.notes || 'Sem observações.'}</p>
                                        </div>
                                        <div className="text-xs text-right bg-gray-50 px-2 py-1 rounded border self-start">
                                            <span className="text-gray-400 block">Responsável</span>
                                            <span className="font-medium text-gray-700">{log.adminUser}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {deviceHistory.length === 0 && (
                                <p className="text-gray-400 text-sm pl-6">Nenhum histórico registrado.</p>
                            )}
                        </div>
                    </div>
                )}
            
            </div>

            {/* Footer Actions (Only for General/Financial as Maintenance saves instantly) */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Fechar</button>
                {(activeTab === 'GENERAL' || activeTab === 'FINANCIAL') && (
                    <button type="submit" form="deviceForm" onClick={activeTab === 'FINANCIAL' ? handleDeviceSubmit : undefined} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingId ? 'Salvar Alterações' : 'Cadastrar Dispositivo'}
                    </button>
                )}
            </div>

          </div>
        </div>
      )}

      {/* Model Settings Modal */}
      {isModelSettingsOpen && <ModelSettings onClose={() => setIsModelSettingsOpen(false)} />}
    </div>
  );
};

// Helper for X icon
const X = ({size}: {size: number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default DeviceManager;