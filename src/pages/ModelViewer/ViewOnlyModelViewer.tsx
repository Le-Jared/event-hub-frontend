import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Environment } from '@react-three/drei';
import { Model } from './Model';

interface ModelConfig {
  modelData: string;
  backgroundColor: string;
  lightIntensity: number;
  modelScale: number;
  autoRotate: boolean;
}

const ViewOnlyModelViewer = () => {
  const [config, setConfig] = useState<ModelConfig | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('modelConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  if (!config || !config.modelData) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No model configuration found</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] relative bg-white rounded-lg">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <Stage adjustCamera environment="city" intensity={config.lightIntensity}>
            <Model data={config.modelData} scale={config.modelScale} />
          </Stage>
          <OrbitControls autoRotate={config.autoRotate} autoRotateSpeed={2} />
          <Environment preset="sunset" />
          <color attach="background" args={[config.backgroundColor]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ViewOnlyModelViewer;