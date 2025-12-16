export enum DeviceStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Uso',
  MAINTENANCE = 'Manutenção',
  RETIRED = 'Descartado'
}

// Configurações Dinâmicas (Substitui o Enum estático para permitir cadastro)
export interface AssetType {
  id: string;
  name: string; // Ex: Smartphone, Notebook
}

export interface DeviceBrand {
  id: string;
  name: string; // Ex: Dell, Apple
}

export interface DeviceModel {
  id: string;
  name: string; // Ex: iPhone 13, Latitude 5420
  brandId: string;
  typeId: string;
  imageUrl?: string; // Foto do modelo
}

// Manutenção
export enum MaintenanceType {
  CORRECTIVE = 'Corretiva',
  PREVENTIVE = 'Preventiva',
  AUDIT = 'Auditoria'
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  type: MaintenanceType;
  date: string;
  description: string;
  cost: number;
  provider: string; // Prestador de serviço
  invoiceUrl?: string; // Anexo da nota de serviço
}

export interface Device {
  id: string;
  // Relacionamento com Modelo (que contém Marca e Tipo)
  modelId: string; 
  
  serialNumber: string;
  assetTag: string; // Patrimônio
  status: DeviceStatus;
  currentUserId?: string | null;
  
  // Novos Campos Solicitados
  imei?: string;         // Para Celulares/Tablets
  pulsusId?: string;     // ID do MDM Pulsus
  sectorId?: string;     // Relacionamento com Setor (Vendas, TI, etc)
  costCenter?: string;   // Código do Setor / Centro de Custo

  // Vínculo com Chip (Opcional)
  linkedSimId?: string | null;

  // Dados de Compra / Financeiro
  purchaseDate: string;
  purchaseCost: number;
  invoiceNumber?: string;
  supplier?: string;
  purchaseInvoiceUrl?: string; // Anexo da nota de compra
}

export interface SimCard {
  id: string;
  phoneNumber: string;
  operator: string;
  iccid: string;
  status: DeviceStatus;
  currentUserId?: string | null;
  planDetails?: string;
}

// Setores Dinâmicos
export interface UserSector {
  id: string;
  name: string;
}

// Termo de Responsabilidade
export interface Term {
  id: string;
  userId: string;
  type: 'ENTREGA' | 'DEVOLUCAO';
  assetDetails: string; // Ex: "iPhone 13 (Tag: 001)"
  date: string;
  fileUrl: string; // URL do PDF/Imagem assinado
}

export interface User {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  pis?: string;
  address: string;
  email: string;
  sectorId: string; // ID do setor
  jobTitle: string;
  active: boolean;
  terms?: Term[]; // Lista de termos assinados
}

export enum SystemRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR' 
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: SystemRole;
  avatarUrl?: string;
}

export interface SystemSettings {
  appName: string;
  cnpj?: string; // Novo campo
  logoUrl: string;
  termTemplate?: string; // HTML do termo de responsabilidade
}

export enum ActionType {
  create = 'Criação',
  UPDATE = 'Atualização',
  DELETE = 'Exclusão',
  CHECKOUT = 'Entrega',
  CHECKIN = 'Devolução',
  MAINTENANCE_START = 'Envio Manutenção',
  MAINTENANCE_END = 'Retorno Manutenção',
  LOGIN = 'Login',
  INACTIVATE = 'Inativação',
  ACTIVATE = 'Ativação'
}

export interface AuditLog {
  id: string;
  assetId: string;
  assetType: 'Device' | 'Sim' | 'User' | 'System' | 'Model' | 'Brand' | 'Type' | 'Sector';
  targetName?: string;
  action: ActionType;
  timestamp: string;
  notes?: string;
  adminUser: string;
}

export interface DashboardStats {
  totalDevices: number;
  availableDevices: number;
  totalSims: number;
  activeUsers: number;
}