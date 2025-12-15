import { Device, DeviceStatus, DeviceType, SimCard, User, UserSector, AuditLog, ActionType } from '../types';

// Generators
const generateId = () => Math.random().toString(36).substr(2, 9);

export const mockDevices: Device[] = [
  {
    id: 'd1',
    name: 'Dell Latitude 5420',
    type: DeviceType.NOTEBOOK,
    brand: 'Dell',
    model: 'Latitude 5420',
    serialNumber: '8H2K92',
    assetTag: 'TI-001',
    purchaseDate: '2023-01-15',
    status: DeviceStatus.AVAILABLE,
    currentUserId: null,
  },
  {
    id: 'd2',
    name: 'iPhone 13 Corp',
    type: DeviceType.SMARTPHONE,
    brand: 'Apple',
    model: 'iPhone 13 128GB',
    serialNumber: 'FFGJW2',
    assetTag: 'TI-002',
    purchaseDate: '2023-03-10',
    status: DeviceStatus.IN_USE,
    currentUserId: 'u1',
  },
  {
    id: 'd3',
    name: 'Samsung Galaxy S21',
    type: DeviceType.SMARTPHONE,
    brand: 'Samsung',
    model: 'S21 FE',
    serialNumber: 'R5CR20',
    assetTag: 'TI-003',
    purchaseDate: '2022-11-05',
    status: DeviceStatus.MAINTENANCE,
    currentUserId: null,
  },
  {
    id: 'd4',
    name: 'Lenovo ThinkPad',
    type: DeviceType.NOTEBOOK,
    brand: 'Lenovo',
    model: 'E14 Gen 2',
    serialNumber: 'PF2X99',
    assetTag: 'TI-004',
    purchaseDate: '2023-06-20',
    status: DeviceStatus.IN_USE,
    currentUserId: 'u2',
  }
];

export const mockSims: SimCard[] = [
  {
    id: 's1',
    phoneNumber: '(11) 99999-1234',
    operator: 'Vivo',
    iccid: '89551012345678901234',
    status: DeviceStatus.IN_USE,
    currentUserId: 'u1',
    planDetails: 'Smart Empresas 20GB'
  },
  {
    id: 's2',
    phoneNumber: '(11) 98888-5678',
    operator: 'Claro',
    iccid: '89550509876543210987',
    status: DeviceStatus.AVAILABLE,
    currentUserId: null,
    planDetails: 'Claro Total 50GB'
  }
];

export const mockUsers: User[] = [
  {
    id: 'u1',
    fullName: 'Carlos Silva',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    pis: '12345678901',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    email: 'carlos.silva@empresa.com.br',
    sector: UserSector.SALES,
    jobTitle: 'Gerente de Contas',
    active: true,
  },
  {
    id: 'u2',
    fullName: 'Ana Pereira',
    cpf: '987.654.321-11',
    rg: '22.333.444-5',
    pis: '10987654321',
    address: 'Rua Augusta, 500 - São Paulo, SP',
    email: 'ana.pereira@empresa.com.br',
    sector: UserSector.ADMIN,
    jobTitle: 'Analista Financeiro',
    active: true,
  },
  {
    id: 'u3',
    fullName: 'Roberto Santos',
    cpf: '456.789.123-22',
    rg: '44.555.666-7',
    address: 'Rua Funchal, 200 - São Paulo, SP',
    email: 'roberto.santos@empresa.com.br',
    sector: UserSector.PROMOTER,
    jobTitle: 'Promotor de Vendas',
    active: true,
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log1',
    assetId: 'd2',
    assetType: 'Device',
    userId: 'u1',
    action: ActionType.CHECKOUT,
    timestamp: '2023-03-12T09:00:00Z',
    adminUser: 'Admin System',
    notes: 'Entrega inicial - Kit novo'
  },
  {
    id: 'log2',
    assetId: 's1',
    assetType: 'Sim',
    userId: 'u1',
    action: ActionType.CHECKOUT,
    timestamp: '2023-03-12T09:05:00Z',
    adminUser: 'Admin System',
    notes: 'Entrega linha corporativa'
  }
];

// Helper to simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));