
import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Device, User, SimCard, DeviceStatus, UserSector, DeviceModel, DeviceBrand, AssetType } from '../types';
import { Download, Upload, FileText, CheckCircle, AlertTriangle, Loader2, Database, ArrowRight, RefreshCcw, X, CheckSquare, ChevronRight, ChevronDown } from 'lucide-react';

type ImportType = 'USERS' | 'DEVICES' | 'SIMS';

interface DiffItem {
    field: string;
    oldValue: string;
    newValue: string;
}

interface AnalysisResult {
    status: 'NEW' | 'UNCHANGED' | 'CONFLICT' | 'ERROR';
    row: any;
    existingId?: string;
    diffs?: DiffItem[];
    errorMsg?: string;
    selected: boolean;
}

const DataImporter = () => {
  const { 
    users, addUser, updateUser,
    devices, addDevice, updateDevice,
    sims, addSim, updateSim,
    sectors, addSector,
    models, addModel,
    brands, addBrand,
    assetTypes, addAssetType
  } = useData();
  const { user: currentUser } = useAuth();
  
  const [step, setStep] = useState<'UPLOAD' | 'ANALYSIS' | 'PROCESSING' | 'DONE'>('UPLOAD');
  const [importType, setImportType] = useState<ImportType>('USERS');
  const [analyzedData, setAnalyzedData] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, created: 0, updated: 0, errors: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminName = currentUser?.name || 'Importador';

  const getTemplateHeaders = () => {
      switch(importType) {
          case 'USERS': return 'Nome Completo,Email,CPF,PIS,Funcao (Dropdown),Setor/Codigo (Texto),RG,Endereco';
          case 'DEVICES': return 'Patrimonio,Serial,Modelo,Marca,Tipo,Status,Valor Pago,Data Compra(AAAA-MM-DD),Fornecedor,IMEI,ID Pulsus,Setor Ativo,Centro de Custo';
          case 'SIMS': return 'Numero,Operadora,ICCID,Plano';
          default: return '';
      }
  };

  const downloadTemplate = () => {
      const headers = getTemplateHeaders();
      const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${importType.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => parseAndAnalyze(evt.target?.result as string);
      reader.readAsText(file);
  };

  const parseAndAnalyze = (text: string) => {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return alert('Arquivo vazio ou sem dados.');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          return headers.reduce((obj: any, header, index) => {
              obj[header] = values[index] || '';
              return obj;
          }, {});
      });
      setAnalyzedData(rows.map(row => analyzeRow(row)));
      setStep('ANALYSIS');
  };

  const analyzeRow = (row: any): AnalysisResult => {
      try {
          if (importType === 'USERS') {
              const email = row['Email'];
              const cpf = row['CPF'];
              if (!email && !cpf) throw new Error('Email ou CPF obrigatório');
              const existing = users.find(u => (email && u.email.toLowerCase() === email.toLowerCase()) || (cpf && u.cpf.replace(/\D/g,'') === cpf.replace(/\D/g,'')));
              if (!existing) return { status: 'NEW', row, selected: true };
              return { status: 'CONFLICT', row, existingId: existing.id, diffs: [], selected: true };
          } else if (importType === 'DEVICES') {
              const tag = row['Patrimonio'];
              const imei = row['IMEI'];
              if (!tag && !imei) throw new Error('Patrimônio ou IMEI obrigatório');
              const existing = devices.find(d => (tag && d.assetTag.toLowerCase() === tag.toLowerCase()) || (imei && d.imei === imei));
              if (!existing) return { status: 'NEW', row, selected: true };
              return { status: 'CONFLICT', row, existingId: existing.id, diffs: [], selected: true };
          } else {
              const num = row['Numero'];
              if (!num) throw new Error('Número é obrigatório');
              const existing = sims.find(s => s.phoneNumber === num);
              if (!existing) return { status: 'NEW', row, selected: true };
              return { status: 'CONFLICT', row, existingId: existing.id, diffs: [], selected: true };
          }
      } catch (e: any) {
          return { status: 'ERROR', row, errorMsg: e.message, selected: false };
      }
  };

  const executeImport = async () => {
      const toProcess = analyzedData.filter(i => i.selected && i.status !== 'ERROR' && i.status !== 'UNCHANGED');
      setStep('PROCESSING');
      setProgress({ current: 0, total: toProcess.length, created: 0, updated: 0, errors: 0 });

      const secCache = new Map<string, string>();
      const brandCache = new Map<string, string>();
      const typeCache = new Map<string, string>();
      const modelCache = new Map<string, string>();

      const resolveSector = (name: string): string => {
          if (!name) return '';
          const norm = name.trim().toLowerCase();
          const existing = sectors.find(s => s.name.toLowerCase() === norm);
          if (existing) return existing.id;
          if (secCache.has(norm)) return secCache.get(norm)!;
          const newId = Math.random().toString(36).substr(2, 9);
          addSector({ id: newId, name: name.trim() }, adminName);
          secCache.set(norm, newId);
          return newId;
      };

      for (let i = 0; i < toProcess.length; i++) {
          const item = toProcess[i];
          try {
              if (importType === 'USERS') {
                  const sId = resolveSector(item.row['Funcao (Dropdown)']);
                  if (item.status === 'NEW') {
                      addUser({
                          id: Math.random().toString(36).substr(2, 9),
                          fullName: item.row['Nome Completo'],
                          email: item.row['Email'],
                          cpf: item.row['CPF'],
                          pis: item.row['PIS'],
                          jobTitle: item.row['Setor/Codigo (Texto)'],
                          sectorId: sId,
                          rg: item.row['RG'],
                          address: item.row['Endereco'],
                          active: true, terms: []
                      }, adminName);
                      setProgress(p => ({ ...p, created: p.created + 1 }));
                  }
              } else if (importType === 'DEVICES') {
                  // Resolve Brand
                  const bName = item.row['Marca'] || 'Genérica';
                  let bId = brands.find(b => b.name.toLowerCase() === bName.toLowerCase())?.id;
                  if (!bId && brandCache.has(bName.toLowerCase())) bId = brandCache.get(bName.toLowerCase());
                  if (!bId) {
                      bId = Math.random().toString(36).substr(2, 9);
                      addBrand({ id: bId, name: bName }, adminName);
                      brandCache.set(bName.toLowerCase(), bId);
                  }
                  // Resolve Type
                  const tName = item.row['Tipo'] || 'Outros';
                  let tId = assetTypes.find(t => t.name.toLowerCase() === tName.toLowerCase())?.id;
                  if (!tId && typeCache.has(tName.toLowerCase())) tId = typeCache.get(tName.toLowerCase());
                  if (!tId) {
                      tId = Math.random().toString(36).substr(2, 9);
                      addAssetType({ id: tId, name: tName }, adminName);
                      typeCache.set(tName.toLowerCase(), tId);
                  }
                  // Resolve Model
                  const mName = item.row['Modelo'] || 'Genérico';
                  let mId = models.find(m => m.name.toLowerCase() === mName.toLowerCase() && m.brandId === bId)?.id;
                  if (!mId && modelCache.has(mName.toLowerCase() + bId)) mId = modelCache.get(mName.toLowerCase() + bId);
                  if (!mId) {
                      mId = Math.random().toString(36).substr(2, 9);
                      addModel({ id: mId, name: mName, brandId: bId, typeId: tId, imageUrl: '' }, adminName);
                      modelCache.set(mName.toLowerCase() + bId, mId);
                  }

                  const tag = item.row['Patrimonio'];
                  const imei = item.row['IMEI'];
                  const cost = parseFloat(item.row['Valor Pago']?.replace(',', '.')) || 0;
                  const date = item.row['Data Compras'] || item.row['Data Compra'] || item.row['Data Compra(AAAA-MM-DD)'] || new Date().toISOString().split('T')[0];
                  
                  const deviceData: Device = {
                      id: item.status === 'NEW' ? Math.random().toString(36).substr(2, 9) : item.existingId!,
                      modelId: mId,
                      assetTag: tag || imei,
                      serialNumber: item.row['Serial'] || tag || imei,
                      status: (item.row['Status'] as DeviceStatus) || DeviceStatus.AVAILABLE,
                      purchaseCost: cost,
                      purchaseDate: date,
                      supplier: item.row['Fornecedor'],
                      pulsusId: item.row['ID Pulsus'],
                      imei: imei || undefined,
                      sectorId: resolveSector(item.row['Setor Ativo']),
                      costCenter: item.row['Centro de Custo'],
                      currentUserId: null
                  };

                  if (item.status === 'NEW') {
                      addDevice(deviceData, adminName);
                      setProgress(p => ({ ...p, created: p.created + 1 }));
                  } else {
                      updateDevice(deviceData, adminName);
                      setProgress(p => ({ ...p, updated: p.updated + 1 }));
                  }
              }
              setProgress(p => ({ ...p, current: i + 1 }));
          } catch (e: any) {
              setLogs(prev => [...prev, `Erro (Linha ${i+1}): ${e.message}`]);
              setProgress(p => ({ ...p, errors: p.errors + 1, current: i + 1 }));
          }
      }
      setStep('DONE');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full animate-fade-in">
        <div className="mb-6 flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-blue-600"/> Importador de Dados
                </h3>
                <p className="text-sm text-gray-500">Suba o seu arquivo CSV para cadastrar ou atualizar em lote.</p>
            </div>
            {step !== 'UPLOAD' && step !== 'PROCESSING' && (
                <button onClick={() => setStep('UPLOAD')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <RefreshCcw size={14}/> Reiniciar
                </button>
            )}
        </div>

        {step === 'UPLOAD' && (
            <div className="space-y-6">
                <div className="flex gap-4">
                    {(['USERS', 'DEVICES', 'SIMS'] as ImportType[]).map(t => (
                        <button key={t} onClick={() => setImportType(t)} className={`flex-1 py-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${importType === t ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'hover:bg-gray-50'}`}>
                            <span className="font-bold">{t === 'USERS' ? 'Colaboradores' : t === 'DEVICES' ? 'Dispositivos' : 'Chips'}</span>
                        </button>
                    ))}
                </div>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-4">
                        <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 shadow-sm">
                            <Download size={16}/> Baixar Modelo CSV
                        </button>
                        <label className="flex items-center gap-2 text-sm bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer shadow-md transition-colors font-bold">
                            <Upload size={18}/> Selecionar Arquivo
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>
            </div>
        )}

        {step === 'ANALYSIS' && (
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-4 mb-4 text-xs font-bold uppercase tracking-wider">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full">{analyzedData.filter(i => i.status === 'NEW').length} Novos</div>
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">{analyzedData.filter(i => i.status === 'CONFLICT').length} Atualizações</div>
                    {analyzedData.filter(i => i.status === 'ERROR').length > 0 && (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full">{analyzedData.filter(i => i.status === 'ERROR').length} Erros</div>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-4 py-2">Identificador</th>
                                <th className="px-4 py-2">Ação</th>
                                <th className="px-4 py-2">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyzedData.map((item, idx) => (
                                <tr key={idx} className="border-b">
                                    <td className="px-4 py-2 font-mono">
                                        {importType === 'USERS' ? item.row['Email'] : (item.row['Patrimonio'] || item.row['IMEI'])}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded font-bold ${item.status === 'NEW' ? 'bg-green-100 text-green-700' : item.status === 'CONFLICT' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.status === 'NEW' ? 'CRIAR' : item.status === 'CONFLICT' ? 'ATUALIZAR' : 'ERRO'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-500">{item.errorMsg || (item.status === 'CONFLICT' ? 'Registro existente será mesclado' : 'Pronto para importar')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={executeImport} className="mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700">Confirmar Processamento</button>
            </div>
        )}

        {step === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                <Loader2 size={48} className="text-blue-600 animate-spin"/>
                <div className="text-center">
                    <h3 className="text-lg font-bold">Processando {progress.current} de {progress.total}</h3>
                    <p className="text-sm text-gray-500">Sincronizando com o banco de dados...</p>
                </div>
                <div className="w-full max-w-md bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{width: `${(progress.current/progress.total)*100}%`}}></div>
                </div>
            </div>
        )}

        {step === 'DONE' && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><CheckCircle size={48}/></div>
                <h3 className="text-2xl font-bold">Importação Finalizada</h3>
                <div className="grid grid-cols-3 gap-8 text-center bg-gray-50 p-6 rounded-2xl border">
                    <div><p className="text-2xl font-bold text-green-600">{progress.created}</p><p className="text-xs uppercase font-bold text-gray-400">Criados</p></div>
                    <div><p className="text-2xl font-bold text-orange-600">{progress.updated}</p><p className="text-xs uppercase font-bold text-gray-400">Atualizados</p></div>
                    <div><p className="text-2xl font-bold text-red-600">{progress.errors}</p><p className="text-xs uppercase font-bold text-gray-400">Erros</p></div>
                </div>
                <button onClick={() => setStep('UPLOAD')} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700">Fazer Nova Importação</button>
                {logs.length > 0 && (
                    <div className="w-full max-w-md bg-red-50 p-4 rounded-lg text-xs text-red-700 border border-red-100 max-h-32 overflow-y-auto">
                        <strong>Relatório de Erros:</strong>
                        <ul className="list-disc pl-4 mt-1">{logs.map((l, i) => <li key={i}>{l}</li>)}</ul>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default DataImporter;
