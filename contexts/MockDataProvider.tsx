import React, { useState } from 'react';
import { DataContext, DataContextType } from './DataContext';
import { Device, SimCard, User, AuditLog, DeviceStatus, ActionType } from '../types';
import { mockDevices, mockSims, mockUsers, mockAuditLogs } from '../services/mockService';

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [sims, setSims] = useState<SimCard[]>(mockSims);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);

  // CRUD Operations - Device
  const addDevice = (device: Device) => setDevices(prev => [...prev, device]);
  const updateDevice = (device: Device) => setDevices(prev => prev.map(d => d.id === device.id ? device : d));
  const deleteDevice = (id: string) => setDevices(prev => prev.filter(d => d.id !== id));

  // CRUD Operations - SIM
  const addSim = (sim: SimCard) => setSims(prev => [...prev, sim]);
  const updateSim = (sim: SimCard) => setSims(prev => prev.map(s => s.id === sim.id ? sim : s));
  const deleteSim = (id: string) => setSims(prev => prev.filter(s => s.id !== id));

  // CRUD Operations - User
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const updateUser = (user: User) => setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  // Operations - Assignment
  const assignAsset = (assetType: 'Device' | 'Sim', assetId: string, userId: string, notes: string) => {
    const timestamp = new Date().toISOString();
    const logId = Math.random().toString(36).substr(2, 9);
    
    const newLog: AuditLog = {
      id: logId,
      assetId,
      assetType,
      userId,
      action: ActionType.CHECKOUT,
      timestamp,
      notes,
      adminUser: 'SysAdmin'
    };

    setLogs(prev => [newLog, ...prev]);

    if (assetType === 'Device') {
      setDevices(prev => prev.map(d => d.id === assetId ? { ...d, status: DeviceStatus.IN_USE, currentUserId: userId } : d));
    } else {
      setSims(prev => prev.map(s => s.id === assetId ? { ...s, status: DeviceStatus.IN_USE, currentUserId: userId } : s));
    }
  };

  const returnAsset = (assetType: 'Device' | 'Sim', assetId: string, notes: string) => {
    const timestamp = new Date().toISOString();
    const logId = Math.random().toString(36).substr(2, 9);
    
    let currentUserId: string | null | undefined = null;
    if (assetType === 'Device') {
      currentUserId = devices.find(d => d.id === assetId)?.currentUserId;
    } else {
      currentUserId = sims.find(s => s.id === assetId)?.currentUserId;
    }

    const newLog: AuditLog = {
      id: logId,
      assetId,
      assetType,
      userId: currentUserId,
      action: ActionType.CHECKIN,
      timestamp,
      notes,
      adminUser: 'SysAdmin'
    };

    setLogs(prev => [newLog, ...prev]);

    if (assetType === 'Device') {
      setDevices(prev => prev.map(d => d.id === assetId ? { ...d, status: DeviceStatus.AVAILABLE, currentUserId: null } : d));
    } else {
      setSims(prev => prev.map(s => s.id === assetId ? { ...s, status: DeviceStatus.AVAILABLE, currentUserId: null } : s));
    }
  };

  const getHistory = (assetId: string) => {
    return logs.filter(l => l.assetId === assetId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const value: DataContextType = {
    devices, sims, users, logs,
    addDevice, updateDevice, deleteDevice,
    addSim, updateSim, deleteSim,
    addUser, updateUser, deleteUser,
    assignAsset, returnAsset, getHistory
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};