import React from 'react';
import { MockDataProvider } from './MockDataProvider';
import { ProdDataProvider } from './ProdDataProvider';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lê a configuração do navegador. Se não existir, padrão é 'mock'.
  // Use o Painel Admin > Geral > Fonte de Dados para alternar.
  const appMode = localStorage.getItem('app_mode') || 'mock';

  console.log(`[ITAsset360] Running in ${appMode.toUpperCase()} mode.`);

  if (appMode === 'prod') {
    return <ProdDataProvider>{children}</ProdDataProvider>;
  }

  return <MockDataProvider>{children}</MockDataProvider>;
};