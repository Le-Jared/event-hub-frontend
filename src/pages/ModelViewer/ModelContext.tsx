import React, { createContext, useContext, useState } from 'react';

interface ModelContextType {
  selectedModelUrl: string;
  setSelectedModelUrl: (url: string) => void;
}

const ModelContext = createContext<ModelContextType>({
  selectedModelUrl: '',
  setSelectedModelUrl: () => {},
});

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedModelUrl, setSelectedModelUrl] = useState('');

  return (
    <ModelContext.Provider value={{ selectedModelUrl, setSelectedModelUrl }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModelContext = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
};