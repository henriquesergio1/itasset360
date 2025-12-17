import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Device, User, SimCard, DeviceStatus, UserSector, DeviceModel, DeviceBrand, AssetType } from '../types';
import { Download, Upload, FileText, CheckCircle, AlertTriangle, Loader2, Database, ArrowRight } from 'lucide-react';

type ImportType = 'USERS' | 'DEVICES' | 'SIMS';

const DataImporter = () => {
  const { 
    addUser, addDevice, addSim, 
    sectors, addSector,
    models, addModel,
    brands, addBrand,
    assetTypes, addAssetType,
    users // Para verificar duplicidade
  } = useData();
  const { user: currentUser } = useAuth();
  
  const [importType, setImportType] = useState<ImportType>('USERS');
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminName = currentUser?.name || 'Importador';

  // --- CSV TEMPLATES ---
  const getTemplateHeaders = () => {
      switch(importType) {
          case 'USERS': return 'Nome Completo,Email,CPF,Cargo,Setor,RG,Endereco';
          case 'DEVICES': return 'Patrimonio(Tag),Serial,Modelo,Marca,Tipo,Status,Valor Compra,Data Compra(AAAA-MM-DD),IMEI';
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
      link.setAttribute('download', `template_importacao_${importType.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- PARSER ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          setCsvContent(text);
          parseCSV(text);
      };
      reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
          alert('Arquivo vazio ou sem dados.');
          return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
          // Regex simples para lidar com vírgulas dentro de aspas (caso básico)
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          return headers.reduce((obj: any, header, index) => {
              obj[header] = values[index] || '';
              return obj;
          }, {});
      });
      setPreviewData(data);
      setLogs([]);
      setProgress({ current: 0, total: data.length, errors: 0 });
  };

  // --- PROCESSING LOGIC ---
  const processImport = async () => {
      if (previewData.length === 0) return;
      if (!window.confirm(`Confirma a importação de ${previewData.length} registros para ${importType}?`)) return;

      setIsProcessing(true);
      setLogs([]);
      let successCount = 0;
      let errorCount = 0;

      // Helper para delay (para não travar a UI e permitir atualização de estado)
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

      for (let i = 0; i < previewData.length; i++) {
          const row = previewData[i];
          try {
              if (importType === 'USERS') {
                  await importUser(row);
              } else if (importType === 'DEVICES') {
                  await importDevice(row);
              } else if (importType === 'SIMS') {
                  await importSim(row);
              }
              successCount++;
          } catch (err: any) {
              console.error(err);
              errorCount++;
              setLogs(prev => [...prev, `Erro na linha ${i + 2}: ${err.message}`]);
          }
          
          setProgress({ current: i + 1, total: previewData.length, errors: errorCount });
          await sleep(50); // Pequeno delay para atualizar a barra de progresso visualmente
      }

      setIsProcessing(false);
      alert(`Importação finalizada!\nSucesso: ${successCount}\nErros: ${errorCount}`);
      if (errorCount === 0) {
          setCsvContent('');
          setPreviewData([]);
      }
  };

  // --- ENTITY IMPORTERS ---

  const importUser = async (row: any) => {
      const name = row['Nome Completo'];
      const email = row['Email'];
      const cpf = row['CPF'];
      
      if (!name || !email) throw new Error('Nome e Email são obrigatórios');

      // Verifica duplicidade
      if (users.find(u => u.email === email || u.cpf === cpf)) {
          throw new Error(`Usuário já existe (Email: ${email} ou CPF: ${cpf})`);
      }

      // Resolve Sector (Find or Create)
      let sectorId = '';
      const sectorName = row['Setor'];
      if (sectorName) {
          const existingSector = sectors.find(s => s.name.toLowerCase() === sectorName.toLowerCase());
          if (existingSector) {
              sectorId = existingSector.id;
          } else {
              const newId = Math.random().toString(36).substr(2, 9);
              addSector({ id: newId, name: sectorName }, adminName);
              sectorId = newId;
          }
      }

      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: name,
          email: email,
          cpf: cpf || '',
          jobTitle: row['Cargo'] || 'Não Informado',
          sectorId: sectorId,
          rg: row['RG'] || '',
          address: row['Endereco'] || '',
          active: true,
          terms: []
      };

      addUser(newUser, adminName);
  };

  const importDevice = async (row: any) => {
      const tag = row['Patrimonio(Tag)'];
      const modelName = row['Modelo'];
      
      if (!tag || !modelName) throw new Error('Patrimônio e Modelo são obrigatórios');

      // 1. Resolve Brand
      let brandId = '';
      const brandName = row['Marca'] || 'Genérica';
      const existingBrand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
      if (existingBrand) {
          brandId = existingBrand.id;
      } else {
          brandId = Math.random().toString(36).substr(2, 9);
          addBrand({ id: brandId, name: brandName }, adminName);
      }

      // 2. Resolve Type
      let typeId = '';
      const typeName = row['Tipo'] || 'Outros';
      const existingType = assetTypes.find(t => t.name.toLowerCase() === typeName.toLowerCase());
      if (existingType) {
          typeId = existingType.id;
      } else {
          typeId = Math.random().toString(36).substr(2, 9);
          addAssetType({ id: typeId, name: typeName }, adminName);
      }

      // 3. Resolve Model
      let modelId = '';
      const existingModel = models.find(m => m.name.toLowerCase() === modelName.toLowerCase());
      if (existingModel) {
          modelId = existingModel.id;
      } else {
          modelId = Math.random().toString(36).substr(2, 9);
          addModel({ id: modelId, name: modelName, brandId, typeId, imageUrl: '' }, adminName);
      }

      // 4. Create Device
      const newDevice: Device = {
          id: Math.random().toString(36).substr(2, 9),
          modelId,
          assetTag: tag,
          serialNumber: row['Serial'] || 'S/N',
          status: (row['Status'] as DeviceStatus) || DeviceStatus.AVAILABLE,
          purchaseCost: parseFloat(row['Valor Compra']) || 0,
          purchaseDate: row['Data Compra(AAAA-MM-DD)'] || new Date().toISOString().split('T')[0],
          imei: row['IMEI'] || undefined,
          currentUserId: null
      };

      addDevice(newDevice, adminName);
  };

  const importSim = async (row: any) => {
      const number = row['Numero'];
      if (!number) throw new Error('Número é obrigatório');

      const newSim: SimCard = {
          id: Math.random().toString(36).substr(2, 9),
          phoneNumber: number,
          operator: row['Operadora'] || 'Desconhecida',
          iccid: row['ICCID'] || '',
          planDetails: row['Plano'] || '',
          status: DeviceStatus.AVAILABLE,
          currentUserId: null
      };

      addSim(newSim, adminName);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in flex flex-col h-full">
        <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Database className="text-blue-600"/> Importação em Massa (Migração)
            </h3>
            <p className="text-sm text-gray-500">
                Importe dados de planilhas ou do Snipe-IT. O sistema tentará criar marcas, modelos e setores automaticamente se não existirem.
            </p>
        </div>

        {/* STEP 1: SELECT TYPE */}
        <div className="flex gap-4 mb-6">
            <button onClick={() => { setImportType('USERS'); setPreviewData([]); }} className={`flex-1 py-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${importType === 'USERS' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                <span className="font-bold">Colaboradores</span>
                <span className="text-xs text-gray-500">Nome, CPF, Email, Setor</span>
            </button>
            <button onClick={() => { setImportType('DEVICES'); setPreviewData([]); }} className={`flex-1 py-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${importType === 'DEVICES' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                <span className="font-bold">Dispositivos</span>
                <span className="text-xs text-gray-500">Notebooks, Celulares, Tablets</span>
            </button>
            <button onClick={() => { setImportType('SIMS'); setPreviewData([]); }} className={`flex-1 py-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${importType === 'SIMS' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                <span className="font-bold">Chips / SIMs</span>
                <span className="text-xs text-gray-500">Linhas telefônicas e dados</span>
            </button>
        </div>

        {/* STEP 2: DOWNLOAD & UPLOAD */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
            {previewData.length === 0 ? (
                <>
                    <div className="flex gap-4">
                        <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Download size={16}/> Baixar Modelo CSV ({importType})
                        </button>
                        <label className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm">
                            <Upload size={16}/> Carregar Arquivo CSV
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Certifique-se de salvar o Excel como "CSV UTF-8" para evitar problemas com acentos.</p>
                </>
            ) : (
                <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="text-blue-600"/>
                            <span className="font-bold text-gray-700">{previewData.length} registros encontrados</span>
                        </div>
                        <button onClick={() => { setPreviewData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-sm text-red-500 hover:underline">Cancelar / Trocar Arquivo</button>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-60 overflow-y-auto border rounded-lg bg-white mb-4">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-100 font-bold text-gray-600 sticky top-0">
                                <tr>
                                    {Object.keys(previewData[0]).map(key => (
                                        <th key={key} className="px-3 py-2 border-b">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 20).map((row, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        {Object.values(row).map((val: any, j) => (
                                            <td key={j} className="px-3 py-2 text-gray-600 truncate max-w-[150px]">{val}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {previewData.length > 20 && (
                            <div className="p-2 text-center text-xs text-gray-400 italic">
                                ... e mais {previewData.length - 20} linhas.
                            </div>
                        )}
                    </div>

                    {/* Progress Bar & Logs */}
                    {isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span>Processando... {progress.current} / {progress.total}</span>
                                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                            </div>
                        </div>
                    )}

                    {logs.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-32 overflow-y-auto mb-4">
                            <h5 className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Erros encontrados:</h5>
                            <ul className="list-disc pl-4 text-xs text-red-600">
                                {logs.map((log, i) => <li key={i}>{log}</li>)}
                            </ul>
                        </div>
                    )}

                    {!isProcessing && (
                        <button onClick={processImport} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-md">
                            <CheckCircle size={20}/> Confirmar e Importar {previewData.length} Registros
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default DataImporter;
