import React, { useState, useEffect } from 'react';
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { FolderOpen, Trash2 } from 'lucide-react';

interface ModelFile {
  name: string;
  data: string; 
}

interface ModelManagerProps {
  onSelectModel: (data: string) => void;
  onClearModel: () => void;
}

const ModelManager: React.FC<ModelManagerProps> = ({ onSelectModel, onClearModel }) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const newModel: ModelFile = {
          name: file.name,
          data: base64Data
        };
        const updatedModels = [...models, newModel];
        saveModels(updatedModels);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };

  const handleDeleteModel = (modelToDelete: ModelFile) => {
    const updatedModels = models.filter(model => model.name !== modelToDelete.name);
    saveModels(updatedModels);
    onClearModel();
  };

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4">
      <h2 className="text-2xl font-bold mb-4">Model Manager</h2>
      
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

      <div>
        <h3 className="text-lg font-semibold mb-2">Uploaded Models</h3>
        {models.length === 0 ? (
          <p className="text-gray-500">No models uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {models.map((model) => (
              <li key={model.name} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="truncate flex-1 text-gray-900">{model.name}</span>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectModel(model.data)}
                  >
                    <FolderOpen className="h-4 w-4 text-gray-900" />
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