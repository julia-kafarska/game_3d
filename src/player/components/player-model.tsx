import { useEffect, useState, RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { IPosition } from "../../types/position";

interface GLTFResult {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
}

interface PlayerModelProps {
  initialPosition: IPosition;
  meshRef: RefObject<THREE.Object3D>;
  onModelLoaded: (model: THREE.Group, gltf: GLTFResult) => void;
  visible?: boolean;
}

export function PlayerModel({
  initialPosition,
  meshRef,
  onModelLoaded,
  visible = true,
}: PlayerModelProps) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "/xbot.glb",
      (gltf) => {
        const loadedModel = gltf.scene;
        loadedModel.rotation.y = Math.PI;
        loadedModel.position.set(
          initialPosition.x,
          initialPosition.y,
          initialPosition.z,
        );

        loadedModel.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        setModel(loadedModel);
        onModelLoaded(loadedModel, gltf as GLTFResult);
      },
      undefined,
      (error: ErrorEvent) => {
        console.error("Error loading model:", error);
      },
    );
  }, []);

  if (!model) return null;

  return (
    <mesh visible={visible}>
      <primitive object={model} ref={meshRef} />
    </mesh>
  );
}
