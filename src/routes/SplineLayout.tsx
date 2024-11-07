import React, { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';

// Lazy load the Spline component
const SplinePage = lazy(() => import('@/pages/SplinePage'));

const SplineLayout: React.FC = () => {
  return (
    <div className="w-full h-screen bg-black">
      <Suspense fallback={
        <div className="w-full h-screen flex items-center justify-center text-white">
          Loading...
        </div>
      }>
        <SplinePage />
      </Suspense>
    </div>
  );
};

export default SplineLayout;