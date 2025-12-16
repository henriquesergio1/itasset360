import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Cpu, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { settings } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Credenciais inválidas. Tente admin@empresa.com / admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="flex justify-center mb-4">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" />
            ) : (
                <div className="bg-blue-600 p-3 rounded-xl">
                  <Cpu className="text-white h-8 w-8" />
                </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{settings.appName}</h1>
          <p className="text-gray-400 mt-2 text-sm">Entre para gerenciar seus ativos de TI</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 text-gray-400 h-5 w-5" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                {error}
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">
              Entrar no Sistema
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Acesso restrito a pessoal autorizado.</p>
            <p>Todos os acessos são monitorados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;