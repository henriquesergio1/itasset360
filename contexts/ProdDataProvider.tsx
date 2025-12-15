import React, { useState, useEffect } from 'react';
import { DataContext, DataContextType } from './DataContext';
import { Device, SimCard, User, AuditLog } from '../types';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ProdDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [sims, setSims] = useState<SimCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [devicesRes, simsRes, usersRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/devices`),
          fetch(`${API_URL}/sims`),
          fetch(`${API_URL}/users`),
          fetch(`${API_URL}/logs`)
        ]);

        if (!devicesRes.ok || !simsRes.ok || !usersRes.ok) throw new Error('Falha ao carregar dados da API');

        setDevices(await devicesRes.json());
        setSims(await simsRes.json());
        setUsers(await usersRes.json());
        setLogs(await logsRes.json());
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generic POST helper
  const postData = async (endpoint: string, data: any) => {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to post to ${endpoint}`);
    return res.json();
  };

  // Generic PUT helper
  const putData = async (endpoint: string, data: any) => {
    const res = await fetch(`${API_URL}/${endpoint}/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  };

  // Generic DELETE helper
  const deleteData = async (endpoint: string, id: string) => {
    await fetch(`${API_URL}/${endpoint}/${id}`, { method: 'DELETE' });
  };

  // --- CRUD Implementations ---

  const addDevice = async (device: Device) => {
    try {
      const saved = await postData('devices', device);
      setDevices(prev => [...prev, saved]);
    } catch (e) { alert('Erro ao salvar dispositivo'); }
  };

  const updateDevice = async (device: Device) => {
    await putData('devices', device);
    setDevices(prev => prev.map(d => d.id === device.id ? device : d));
  };

  const deleteDevice = async (id: string) => {
    await deleteData('devices', id);
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const addSim = async (sim: SimCard) => {
    const saved = await postData('sims', sim);
    setSims(prev => [...prev, saved]);
  };

  const updateSim = async (sim: SimCard) => {
    await putData('sims', sim);
    setSims(prev => prev.map(s => s.id === sim.id ? sim : s));
  };

  const deleteSim = async (id: string) => {
    await deleteData('sims', id);
    setSims(prev => prev.filter(s => s.id !== id));
  };

  const addUser = async (user: User) => {
    const saved = await postData('users', user);
    setUsers(prev => [...prev, saved]);
  };

  const updateUser = async (user: User) => {
    await putData('users', user);
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const deleteUser = async (id: string) => {
    await deleteData('users', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const assignAsset = async (assetType: 'Device' | 'Sim', assetId: string, userId: string, notes: string) => {
    const payload = { assetId, assetType, userId, notes, action: 'CHECKOUT' };
    const result = await postData('operations/checkout', payload);
    
    // Optimistic Update or refetch could happen here
    // For simplicity, we assume the backend returns the updated asset and log
    // In a real app, you might just reload the asset list
    window.location.reload(); 
  };

  const returnAsset = async (assetType: 'Device' | 'Sim', assetId: string, notes: string) => {
    const payload = { assetId, assetType, notes, action: 'CHECKIN' };
    await postData('operations/checkin', payload);
    window.location.reload();
  };

  const getHistory = (assetId: string) => {
    return logs.filter(l => l.assetId === assetId);
  };

  const value: DataContextType = {
    devices, sims, users, logs, loading, error,
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