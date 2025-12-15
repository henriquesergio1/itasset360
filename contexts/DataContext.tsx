import React, { createContext, useContext } from 'react';
import { Device, SimCard, User, AuditLog } from '../types';

export interface DataContextType {
  devices: Device[];
  sims: SimCard[];
  users: User[];
  logs: AuditLog[];
  loading?: boolean;
  error?: string | null;
  addDevice: (device: Device) => void;
  updateDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;
  addSim: (sim: SimCard) => void;
  updateSim: (sim: SimCard) => void;
  deleteSim: (id: string) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  assignAsset: (assetType: 'Device' | 'Sim', assetId: string, userId: string, notes: string) => void;
  returnAsset: (assetType: 'Device' | 'Sim', assetId: string, notes: string) => void;
  getHistory: (assetId: string) => AuditLog[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider (Mock or Prod)');
  return context;
};