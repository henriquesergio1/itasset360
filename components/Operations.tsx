import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { DeviceStatus, Device, SimCard } from '../types';
import { ArrowRightLeft, CheckCircle, Smartphone, User as UserIcon } from 'lucide-react';

type OperationType = 'CHECKOUT' | 'CHECKIN';
type AssetType = 'Device' | 'Sim';

const Operations = () => {
  const { devices, sims, users, assignAsset, returnAsset } = useData();
  const [activeTab, setActiveTab] = useState<OperationType>('CHECKOUT');
  const [assetType, setAssetType] = useState<AssetType>('Device');
  
  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering for Select Options
  const availableDevices = devices.filter(d => d.status === DeviceStatus.AVAILABLE);
  const inUseDevices = devices.filter(d => d.status === DeviceStatus.IN_USE);
  
  const availableSims = sims.filter(s => s.status === DeviceStatus.AVAILABLE);
  const inUseSims = sims.filter(s => s.status === DeviceStatus.IN_USE);

  const handleExecute = () => {
    if (activeTab === 'CHECKOUT') {
      assignAsset(assetType, selectedAssetId, selectedUserId, notes);
      setSuccessMsg(`Ativo vinculado com sucesso!`);
    } else {
      returnAsset(assetType, selectedAssetId, notes);
      setSuccessMsg(`Ativo devolvido com sucesso!`);
    }

    // Reset Form
    setSelectedAssetId('');
    setSelectedUserId('');
    setNotes('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Operações</h1>
        <p className="text-gray-500">Realize a entrega ou devolução de equipamentos.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-200 rounded-lg w-full max-w-md">
        <button 
          onClick={() => { setActiveTab('CHECKOUT'); setSelectedAssetId(''); setSelectedUserId(''); }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'CHECKOUT' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Entrega (Vincular)
        </button>
        <button 
          onClick={() => { setActiveTab('CHECKIN'); setSelectedAssetId(''); setSelectedUserId(''); }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'CHECKIN' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Devolução (Retornar)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          
          {/* Asset Type Selector */}
          <div className="flex gap-4 mb-6">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${assetType === 'Device' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="atype" checked={assetType === 'Device'} onChange={() => setAssetType('Device')} className="hidden" />
              <Smartphone size={18} /> Dispositivo
            </label>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${assetType === 'Sim' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="atype" checked={assetType === 'Sim'} onChange={() => setAssetType('Sim')} className="hidden" />
              <ArrowRightLeft size={18} /> Chip / SIM
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side: Asset Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                {activeTab === 'CHECKOUT' ? 'Selecione o Ativo Disponível' : 'Selecione o Ativo em Uso'}
              </label>
              
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {activeTab === 'CHECKOUT' ? (
                  assetType === 'Device' ? availableDevices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.assetTag}</option>
                  )) : availableSims.map(s => (
                    <option key={s.id} value={s.id}>{s.phoneNumber} - {s.operator}</option>
                  ))
                ) : (
                  assetType === 'Device' ? inUseDevices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Com: {users.find(u => u.id === d.currentUserId)?.fullName})</option>
                  )) : inUseSims.map(s => (
                    <option key={s.id} value={s.id}>{s.phoneNumber} (Com: {users.find(u => u.id === s.currentUserId)?.fullName})</option>
                  ))
                )}
              </select>

              {/* Asset Preview Details */}
              {selectedAssetId && (
                <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2 border border-gray-200">
                  <p className="font-semibold text-gray-700">Detalhes:</p>
                  {assetType === 'Device' ? (() => {
                    const d = devices.find(x => x.id === selectedAssetId);
                    return d ? (
                      <>
                        <p>Modelo: {d.model}</p>
                        <p>Serial: {d.serialNumber}</p>
                        <p>Tag: {d.assetTag}</p>
                      </>
                    ) : null;
                  })() : (() => {
                    const s = sims.find(x => x.id === selectedAssetId);
                    return s ? (
                      <>
                        <p>Operadora: {s.operator}</p>
                        <p>ICCID: {s.iccid}</p>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Right Side: User & Action */}
            <div className="space-y-4">
              {activeTab === 'CHECKOUT' && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Selecione o Usuário Destino</label>
                  <div className="relative">
                    <UserIcon className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                    <select 
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Selecione o colaborador...</option>
                      {users.filter(u => u.active).map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} - {u.sector}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'CHECKIN' && selectedAssetId && (
                 <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                   Devolvendo de: <strong>{users.find(u => u.id === (assetType === 'Device' ? devices.find(d => d.id === selectedAssetId)?.currentUserId : sims.find(s => s.id === selectedAssetId)?.currentUserId))?.fullName}</strong>
                 </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  placeholder="Ex: Entregue com carregador, mochila..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button 
                onClick={handleExecute}
                disabled={!selectedAssetId || (activeTab === 'CHECKOUT' && !selectedUserId)}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all
                  ${!selectedAssetId || (activeTab === 'CHECKOUT' && !selectedUserId) 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : activeTab === 'CHECKOUT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {activeTab === 'CHECKOUT' ? 'Confirmar Entrega' : 'Confirmar Devolução'}
              </button>

              {successMsg && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg animate-fade-in">
                  <CheckCircle size={20} />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Operations;