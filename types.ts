export enum DeviceType {
  SMARTPHONE = 'Smartphone',
  NOTEBOOK = 'Notebook',
  DESKTOP = 'Desktop',
  TABLET = 'Tablet',
  SERVER = 'Servidor',
  MONITOR = 'Monitor',
  OTHER = 'Outro'
}

export enum DeviceStatus {
  AVAILABLE = 'Disponível',
  IN_USE = 'Em Uso',
  MAINTENANCE = 'Manutenção',
  RETIRED = 'Descartado'
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber: string;
  assetTag: string; // Patrimônio
  purchaseDate: string;
  status: DeviceStatus;
  currentUserId?: string | null;
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

export enum UserSector {
  SALES = 'Vendas',
  PROMOTER = 'Promotor',
  ADMIN = 'Administrativo',
  IT = 'T.I.',
  HR = 'R.H.',
  LOGISTICS = 'Logística'
}

export interface User {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  pis?: string;
  address: string;
  email: string;
  sector: UserSector;
  jobTitle: string;
  active: boolean;
}

export enum ActionType {
  CHECKOUT = 'Entrega',
  CHECKIN = 'Devolução',
  MAINTENANCE_START = 'Envio Manutenção',
  MAINTENANCE_END = 'Retorno Manutenção'
}

export interface AuditLog {
  id: string;
  assetId: string; // Device ID or Sim ID
  assetType: 'Device' | 'Sim';
  userId?: string | null; // Null if just system maintenance
  action: ActionType;
  timestamp: string;
  notes?: string;
  adminUser: string; // Who performed the action in the system
}

export interface DashboardStats {
  totalDevices: number;
  availableDevices: number;
  totalSims: number;
  activeUsers: number;
}