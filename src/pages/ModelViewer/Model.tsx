import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ModelProps {
  data: string;
  scale?: number;
}

export function Model({ data, scale = 1 }: ModelProps) {
  const gltf = useLoader(GLTFLoader, data);
  return <primitive object={gltf.scene} scale={scale} />;
}