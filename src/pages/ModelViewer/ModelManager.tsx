import React, { useState, useEffect } from 'react';
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { FolderOpen, Trash2 } from 'lucide-react';

interface ModelFile {
  name: string;
  url: string;
}

interface ModelManagerProps {
  onSelectModel: (url: string) => void;
}

const ModelManager: React.FC<ModelManagerProps> = ({ onSelectModel }) => {
  const [models, setModels] = useState<ModelFile[]>([]);

  useEffect(() => {
    const savedModels = localStorage.getItem('uploadedModels');
    if (savedModels) {
      setModels(JSON.parse(savedModels));
    }
  }, []);

  const saveModels = (updatedModels: ModelFile[]) => {
    localStorage.setItem('uploadedModels', JSON.stringify(updatedModels));
    setModels(updatedModels);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newModel: ModelFile = { name: file.name, url };
      const updatedModels = [...models, newModel];
      saveModels(updatedModels);
    }
  };

  const handleDeleteModel = (modelToDelete: ModelFile) => {
    const updatedModels = models.filter(model => model.url !== modelToDelete.url);
    saveModels(updatedModels);
    URL.revokeObjectURL(modelToDelete.url); 
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-2xl font-bold mb-4">Model Manager</h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <Label htmlFor="model-upload">Upload 3D Model</Label>
        <div className="mt-2">
          <Input
            type="file"
            id="model-upload"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="w-full"
          />
        </div>
      </div>

      {/* Model List */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Uploaded Models</h3>
        {models.length === 0 ? (
          <p className="text-gray-500">No models uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {models.map((model) => (
              <li key={model.url} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="truncate flex-1">{model.name}</span>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectModel(model.url)}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteModel(model)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ModelManager;