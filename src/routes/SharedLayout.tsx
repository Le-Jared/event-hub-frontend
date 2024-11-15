import React from 'react';
import { Outlet } from 'react-router-dom';
import { QuestionProvider } from '../contexts/QuestionContext';

const SharedLayout: React.FC = () => {
  return (
    <QuestionProvider>
      <Outlet />
    </QuestionProvider>
  );
};

export default SharedLayout;