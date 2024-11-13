import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { Upload, RotateCw, ZoomIn, ZoomOut, Sun, Moon,Trash2,Download,Maximize2} from 'lucide-react';

function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} />;
}

const ModelViewer = () => {
  const [modelUrl, setModelUrl] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [modelScale, setModelScale] = useState(1);
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setModelScale(1);
    setAutoRotate(false);
    setLightIntensity(0.5);
    setBackgroundColor('#ffffff');
  };

  const handleRemoveModel = () => {
    setModelUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'model-screenshot.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-4" ref={containerRef}>
      {/* Left side - Model Viewer */}
      <div className={`flex-1 bg-white rounded-lg shadow-lg mr-4 relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
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
                onClick={downloadScreenshot}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400">
            <Upload className="h-12 w-12 mb-4" />
            <p className="text-lg">Drag and drop a 3D model or click to upload</p>
            <p className="text-sm mt-2">Supports .glb and .gltf formats</p>
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="w-80 bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-2xl font-bold mb-4">Model Controls</h2>
        
        {/* File Upload */}
        <div className="mb-6">
          <Label htmlFor="model-upload">Upload 3D Model</Label>
          <input
            ref={fileInputRef}
            type="file"
            id="model-upload"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex gap-2 mt-2">
            <Button 
              onClick={triggerFileInput}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            {modelUrl && (
              <Button 
                variant="destructive"
                onClick={handleRemoveModel}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {modelUrl && (
            <p className="text-sm text-green-500 mt-2">
              Model loaded successfully
            </p>
          )}
        </div>

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

        {/* Reset Button */}
        <Button 
          variant="outline" 
          className="w-full mb-6"
          onClick={handleReset}
        >
          Reset All Settings
        </Button>

        {/* Instructions */}
        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Upload a GLB or GLTF format 3D model</li>
            <li>Left click + drag to rotate</li>
            <li>Right click + drag to pan</li>
            <li>Scroll to zoom in/out</li>
            <li>Use controls to adjust lighting and background</li>
            <li>Toggle auto-rotation with the rotate button</li>
            <li>Take screenshots with the download button</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModelViewer;