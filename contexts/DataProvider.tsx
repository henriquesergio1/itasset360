import React from 'react';
import { MockDataProvider } from './MockDataProvider';
import { ProdDataProvider } from './ProdDataProvider';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ler configuração do LocalStorage. Padrão: 'mock' (seguro para dev)
  // Em produção real, você poderia injetar uma variável de ambiente para mudar o padrão.
  const appMode = localStorage.getItem('app_mode') || 'mock';

  console.log(`[ITAsset360] Running in ${appMode.toUpperCase()} mode.`);

  if (appMode === 'prod') {
    return <ProdDataProvider>{children}</ProdDataProvider>;
  }

  return <MockDataProvider>{children}</MockDataProvider>;
};