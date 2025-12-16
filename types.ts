export enum DeviceStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Uso',
  MAINTENANCE = 'Manutenção',
  RETIRED = 'Descartado'
}

// Configurações Dinâmicas
export interface AssetType {
  id: string;
  name: string; 
}

export interface DeviceBrand {
  id: string;
  name: string; 
}

export interface DeviceModel {
  id: string;
  name: string; 
  brandId: string;
  typeId: string;
  imageUrl?: string; 
}

// Novos Tipos para Acessórios
export interface AccessoryType {
    id: string;
    name: string; // Ex: Carregador, Capa, Mochila, Mouse
}

export interface DeviceAccessory {
    id: string;
    deviceId: string;
    accessoryTypeId: string; // Relacionado a AccessoryType
    name: string; // Nome cacheado ou específico (ex: Carregador 65W)
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  type: MaintenanceType;
  date: string;
  description: string;
  cost: number;
  provider: string; 
  invoiceUrl?: string; 
}

export enum MaintenanceType {
  CORRECTIVE = 'Corretiva',
  PREVENTIVE = 'Preventiva',
  AUDIT = 'Auditoria'
}

export interface Device {
  id: string;
  modelId: string; 
  serialNumber: string;
  assetTag: string; 
  status: DeviceStatus;
  currentUserId?: string | null;
  
  imei?: string;         
  pulsusId?: string;     
  sectorId?: string;     
  costCenter?: string;   

  linkedSimId?: string | null;
  
  // Array de acessórios vinculados a este dispositivo
  accessories?: DeviceAccessory[]; 

  purchaseDate: string;
  purchaseCost: number;
  invoiceNumber?: string;
  supplier?: string;
  purchaseInvoiceUrl?: string; 
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

export interface UserSector {
  id: string;
  name: string;
}

export interface Term {
  id: string;
  userId: string;
  type: 'ENTREGA' | 'DEVOLUCAO';
  assetDetails: string; 
  date: string;
  fileUrl: string; 
}

// Checklist Dinâmico (Chave = Nome do Acessório, Valor = Boolean)
export type ReturnChecklist = Record<string, boolean>;

export interface User {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  pis?: string;
  address: string;
  email: string;
  sectorId: string; 
  jobTitle: string;
  active: boolean;
  terms?: Term[];
  
  // Nova flag para indicar pendências manuais (ex: devolução incompleta)
  hasPendingIssues?: boolean; 
  pendingIssuesNote?: string;
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
  cnpj?: string; 
  logoUrl: string;
  termTemplate?: string; 
  returnTermTemplate?: string; 
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
  assetType: 'Device' | 'Sim' | 'User' | 'System' | 'Model' | 'Brand' | 'Type' | 'Sector' | 'Accessory';
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