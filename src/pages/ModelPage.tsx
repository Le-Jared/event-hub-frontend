import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { RotateCw, ZoomIn, ZoomOut, Sun, Moon,Maximize2} from 'lucide-react';
import ModelManager from './components/ModelManager';

function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} />;
}

interface ModelViewerProps {
  viewOnly?: boolean;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ viewOnly = false }) => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [modelScale, setModelScale] = useState(1);
  const [lightIntensity, setLightIntensity] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(!viewOnly);

  const handleSelectModel = (url: string) => {
    setModelUrl(url);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-4">
      {/* Left side - Model Viewer */}
      <div className={`bg-white rounded-lg shadow-lg ${viewOnly ? 'w-full' : 'flex-1 mr-4'} relative`}>
        {modelUrl ? (
          <>
            <Canvas style={{ height: '80vh' }}>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <Stage adjustCamera environment="city" intensity={lightIntensity}>
                  <Model url={modelUrl} scale={modelScale} />
                </Stage>
                <OrbitControls autoRotate={autoRotate} autoRotateSpeed={2} />
                <Environment preset="sunset" />
              </Suspense>
              <color attach="background" args={[backgroundColor]} />
            </Canvas>
            {!viewOnly && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModelScale(s => Math.max(0.1, s - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModelScale(s => s + 0.1)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAutoRotate(!autoRotate)}
                >
                  <RotateCw className={`h-4 w-4 ${autoRotate ? 'text-blue-500' : ''}`} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400">
            <p className="text-lg">Select a model from the Model Manager</p>
          </div>
        )}
      </div>
  
      {/* Right side - Controls and Model Manager */}
      {!viewOnly && (
        <div className="w-96 space-y-4">
          <ModelManager onSelectModel={handleSelectModel} />
  
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-2xl font-bold mb-4">Viewer Controls</h2>
  
            {/* Background Color */}
            <div className="mb-6">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  id="background-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
  
            {/* Lighting Control */}
            <div className="mb-6">
              <Label>Lighting Intensity</Label>
              <div className="flex items-center gap-2 mt-2">
                <Moon className="h-4 w-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(Number(e.target.value))}
                  className="flex-1"
                />
                <Sun className="h-4 w-4" />
              </div>
            </div>
  
            {/* Instructions */}
            <div className="mt-8 text-sm text-gray-600">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload models using the Model Manager</li>
                <li>Select a model to view it</li>
                <li>Left click + drag to rotate</li>
                <li>Right click + drag to pan</li>
                <li>Scroll to zoom in/out</li>
                <li>Use controls to adjust lighting and background</li>
                <li>Toggle auto-rotation with the rotate button</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;