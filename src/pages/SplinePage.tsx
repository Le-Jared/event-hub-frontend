import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/shadcn/ui/button";
import Spline from '@splinetool/react-spline';

const SplinePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleWelcomeClick = () => {
    navigate('/home');
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl z-20">
          Loading 3D Scene...
        </div>
      )}

      <div className="absolute inset-0">
        {!loadError && (
          <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
            <Spline
              scene="https://prod.spline.design/fM6WpzHtdDHYNfoN/scene.splinecode"
              onLoad={() => {
                setIsLoading(false);
                console.log('Spline scene loaded successfully');
              }}
              onError={() => {
                setLoadError(true);
                setIsLoading(false);
              }}
            />
          </div>
        )}
      </div>

      {showButton && !isLoading && !loadError && (
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          style={{ top: '90%' }}
        >
          <Button
            onClick={handleWelcomeClick}
            className="px-8 py-4 text-xl font-bold bg-white text-black hover:bg-gray-200 transition-all duration-300 ease-in-out
                   opacity-0 animate-fadeIn"
            style={{
              animationFillMode: 'forwards',
              animationDelay: '0.5s'
            }}
          >
            Welcome
          </Button>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          <p className="text-white mb-4">Unable to load 3D scene</p>
          <Button
            onClick={handleWelcomeClick}
            className="px-8 py-4 text-xl font-bold bg-white text-black hover:bg-gray-200"
          >
            Continue Anyway
          </Button>
        </div>
      )}
    </div>
  );
};

export default SplinePage;