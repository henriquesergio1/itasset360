import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { AssetType, DeviceBrand, DeviceModel } from '../types';
import { Plus, Trash2, X, Image as ImageIcon, Save, Tag, Box, Layers } from 'lucide-react';

interface ModelSettingsProps {
  onClose: () => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ onClose }) => {
  const { 
    assetTypes, addAssetType, deleteAssetType,
    brands, addBrand, deleteBrand,
    models, addModel, updateModel, deleteModel 
  } = useData();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'TYPES' | 'BRANDS' | 'MODELS'>('TYPES');

  // Forms
  const [newType, setNewType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [modelForm, setModelForm] = useState<Partial<DeviceModel>>({ imageUrl: '' });

  const adminName = user?.name || 'Admin';

  const handleAddType = () => {
    if (!newType) return;
    addAssetType({ id: Math.random().toString(36).substr(2, 9), name: newType }, adminName);
    setNewType('');
  };

  const handleAddBrand = () => {
    if (!newBrand) return;
    addBrand({ id: Math.random().toString(36).substr(2, 9), name: newBrand }, adminName);
    setNewBrand('');
  };

  const handleModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.name || !modelForm.brandId || !modelForm.typeId) return;

    if (modelForm.id) {
       updateModel(modelForm as DeviceModel, adminName);
    } else {
       addModel({ 
         ...modelForm, 
         id: Math.random().toString(36).substr(2, 9) 
       } as DeviceModel, adminName);
    }
    setModelForm({ imageUrl: '' });
  };

  // Simulate Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, this would upload to server. Here we just pretend with a URL or Placeholder
    // For demo, we might prompt user for URL or just set a placeholder if they click upload
    const file = e.target.files?.[0];
    if (file) {
        // Create a fake local URL for preview
        const objectUrl = URL.createObjectURL(file);
        setModelForm({ ...modelForm, imageUrl: objectUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={20} /> Configurações de Ativos
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        {/* Tabs & Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-2 shrink-0">
            <button 
              onClick={() => setActiveTab('TYPES')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'TYPES' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Tag size={18} /> Tipos de Dispositivo
            </button>
            <button 
              onClick={() => setActiveTab('BRANDS')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'BRANDS' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Box size={18} /> Marcas / Fabricantes
            </button>
            <button 
              onClick={() => setActiveTab('MODELS')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'MODELS' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Layers size={18} /> Modelos & Fotos
            </button>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            
            {/* --- TYPES --- */}
            {activeTab === 'TYPES' && (
              <div className="max-w-xl">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Tipos de Equipamento</h4>
                <div className="flex gap-2 mb-6">
                   <input 
                      type="text" 
                      placeholder="Novo Tipo (ex: Projetor)" 
                      className="flex-1 border rounded-lg p-2"
                      value={newType}
                      onChange={e => setNewType(e.target.value)}
                   />
                   <button onClick={handleAddType} className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700"><Plus/></button>
                </div>
                <div className="space-y-2">
                   {assetTypes.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                         <span className="font-medium">{t.name}</span>
                         <button onClick={() => deleteAssetType(t.id, adminName)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {/* --- BRANDS --- */}
            {activeTab === 'BRANDS' && (
              <div className="max-w-xl">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Marcas e Fabricantes</h4>
                <div className="flex gap-2 mb-6">
                   <input 
                      type="text" 
                      placeholder="Nova Marca (ex: Logitech)" 
                      className="flex-1 border rounded-lg p-2"
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                   />
                   <button onClick={handleAddBrand} className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700"><Plus/></button>
                </div>
                <div className="space-y-2">
                   {brands.map(b => (
                      <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                         <span className="font-medium">{b.name}</span>
                         <button onClick={() => deleteBrand(b.id, adminName)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                   ))}
                </div>
              </div>
            )}

            {/* --- MODELS --- */}
            {activeTab === 'MODELS' && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-gray-800">Catálogo de Modelos</h4>
                
                {/* Form */}
                <form onSubmit={handleModelSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h5 className="font-semibold text-gray-700 mb-4">{modelForm.id ? 'Editar Modelo' : 'Cadastrar Novo Modelo'}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium mb-1">Nome do Modelo</label>
                           <input required type="text" className="w-full border rounded-lg p-2" value={modelForm.name || ''} onChange={e => setModelForm({...modelForm, name: e.target.value})} placeholder="Ex: iPhone 14 Pro"/>
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Marca</label>
                           <select required className="w-full border rounded-lg p-2" value={modelForm.brandId || ''} onChange={e => setModelForm({...modelForm, brandId: e.target.value})}>
                              <option value="">Selecione...</option>
                              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Tipo</label>
                           <select required className="w-full border rounded-lg p-2" value={modelForm.typeId || ''} onChange={e => setModelForm({...modelForm, typeId: e.target.value})}>
                              <option value="">Selecione...</option>
                              {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Imagem do Dispositivo</label>
                            <div className="flex items-center gap-3">
                                {modelForm.imageUrl ? (
                                    <img src={modelForm.imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded bg-white border" />
                                ) : (
                                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                                )}
                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50">
                                    Escolher Arquivo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                                {/* Fallback URL input */}
                                <input type="text" placeholder="Ou cole URL..." className="flex-1 border rounded-lg p-2 text-sm" value={modelForm.imageUrl || ''} onChange={e => setModelForm({...modelForm, imageUrl: e.target.value})}/>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        {modelForm.id && <button type="button" onClick={() => setModelForm({ imageUrl: '' })} className="text-gray-500 px-4 py-2">Cancelar Edição</button>}
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <Save size={18}/> Salvar Modelo
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {models.map(m => {
                        const brand = brands.find(b => b.id === m.brandId);
                        const type = assetTypes.find(t => t.id === m.typeId);
                        return (
                            <div key={m.id} className="flex items-center gap-4 bg-white border p-4 rounded-lg hover:shadow-sm">
                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border">
                                    {m.imageUrl ? <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" /> : <ImageIcon className="text-gray-300"/>}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{m.name}</h4>
                                    <p className="text-xs text-gray-500">{brand?.name} • {type?.name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setModelForm(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteModel(m.id, adminName)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const Edit2 = ({size}: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

export default ModelSettings;