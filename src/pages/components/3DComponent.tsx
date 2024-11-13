import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Html, useProgress } from "@react-three/drei";
import * as THREE from 'three';
import { Card } from "@/components/shadcn/ui/card";

type GLTFResult = {
  nodes: { [key: string]: THREE.Mesh };
  materials: { [key: string]: THREE.Material };
  scene: THREE.Group;
};

interface Props {
  isMobile: boolean;
}

const Phone: React.FC<Props> = ({ isMobile }) => {
  const phone = useGLTF("./my3.glb") as unknown as GLTFResult;
  const phoneRef = React.useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (phoneRef.current) {
      phoneRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={phoneRef}>
      <hemisphereLight intensity={0.15} groundColor='black' />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1} />
      <primitive
        object={phone.scene}
        scale={isMobile ? 0.7 : 1.2}
        position={[0, -3, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
};

const CanvasLoader: React.FC = () => {
  const { progress } = useProgress();
  
  return (
    <Html
      as="div"
      center
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <span className="canvas-loader"></span>
      <p
        style={{
          fontSize: 14,
          color: "#F1F1F1",
          fontWeight: 800,
          marginTop: 40,
        }}
      >
        {progress.toFixed(2)}%
      </p>
    </Html>
  );
};


const ThreeDViewer: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia("(max-width: 500px)");
      setIsMobile(mediaQuery.matches);

      const handleMediaQueryChange = (event: MediaQueryListEvent) => {
        setIsMobile(event.matches);
      };

      mediaQuery.addEventListener("change", handleMediaQueryChange);

      return () => {
        mediaQuery.removeEventListener("change", handleMediaQueryChange);
      };
    }
  }, []);

  return (
    <Card className="h-full w-full bg-gray-800">
      <div className="w-full h-full">
        <Canvas
          frameloop='demand'
          shadows
          dpr={[1, 2]}
          camera={{ position: [20, 3, 5], fov: 20 }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={<CanvasLoader />}>
            <OrbitControls
              enableZoom={false}
              maxPolarAngle={Math.PI}
              minPolarAngle={0}
              target={[0, -1, 0]}
            />
            <Phone isMobile={isMobile} />
          </Suspense>
          <Preload all />
        </Canvas>
      </div>
    </Card>
  );
};


useGLTF.preload("./my3.glb");

export default ThreeDViewer;
