/**
 * VolumetricChunk component - Renders a single chunk of volumetric terrain
 */

import { useEffect, useMemo, useRef, MutableRefObject } from "react";
import * as THREE from "three";
import { IVolumetricChunk } from "../../types/volumetric";

interface VolumetricChunkProps {
  chunk: IVolumetricChunk;
  interactableObjects?: MutableRefObject<THREE.Mesh[]>;
}

export function VolumetricChunk({
  chunk,
  interactableObjects,
}: VolumetricChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Register with interactable objects for raycasting
  useEffect(() => {
    if (meshRef.current && interactableObjects) {
      interactableObjects.current.push(meshRef.current);

      return () => {
        if (interactableObjects.current) {
          const index = interactableObjects.current.indexOf(meshRef.current!);
          if (index > -1) {
            interactableObjects.current.splice(index, 1);
          }
        }
      };
    }
  }, [interactableObjects]);

  // Create geometry from mesh data
  const geometry = useMemo(() => {
    if (!chunk.meshData) {
      return null;
    }

    const geom = new THREE.BufferGeometry();

    // Set position attribute
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(chunk.meshData.positions, 3),
    );

    // Set normal attribute
    geom.setAttribute(
      "normal",
      new THREE.BufferAttribute(chunk.meshData.normals, 3),
    );

    // Set color attribute
    geom.setAttribute(
      "color",
      new THREE.BufferAttribute(chunk.meshData.colors, 3),
    );

    // Set index attribute
    geom.setIndex(new THREE.BufferAttribute(chunk.meshData.indices, 1));

    // Compute bounding box and sphere for frustum culling
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    return geom;
  }, [chunk.meshData]);

  // Create material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false,
      side: THREE.DoubleSide, // Render both sides for caves
    });
  }, []);

  // Clean up geometry on unmount or when chunk changes
  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  // Don't render if no mesh data
  if (!chunk.meshData || !geometry) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      receiveShadow
      castShadow
      name={`volumetric-chunk-${chunk.key}`}
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Lightweight version that accepts pre-created geometry for pooling
 */
interface PooledVolumetricChunkProps {
  geometry: THREE.BufferGeometry;
  chunkKey: string;
  interactableObjects?: MutableRefObject<THREE.Mesh[]>;
}

export function PooledVolumetricChunk({
  geometry,
  chunkKey,
  interactableObjects,
}: PooledVolumetricChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Register with interactable objects for raycasting
  useEffect(() => {
    if (meshRef.current && interactableObjects) {
      interactableObjects.current.push(meshRef.current);

      return () => {
        if (interactableObjects.current) {
          const index = interactableObjects.current.indexOf(meshRef.current!);
          if (index > -1) {
            interactableObjects.current.splice(index, 1);
          }
        }
      };
    }
  }, [interactableObjects]);

  // Shared material for all pooled chunks
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: false,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <mesh
      ref={meshRef}
      receiveShadow
      castShadow
      name={`volumetric-chunk-${chunkKey}`}
    >
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
