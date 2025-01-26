import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextureLoader } from "three";
import { sectorSize } from "../const/settings.ts";
import { OrbitControls } from "@react-three/drei";
import { useMapContext } from "../store/map.tsx";

const initVector = new THREE.Vector3(0, Infinity, 0);

const Terrain = ({ onLeftClick }) => {
  const [loadedTiles, setLoadedTiles] = useState(["0x0"]);
  const [hovered, setHover] = useState([0, 0, 0]);

  const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Color.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_NormalGL.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Roughness.jpg",
  ]);
  useEffect(() => {
    const currentTile = "0x0"; // You can update this based on player movement later
    const neighbours = mapData[currentTile]?.neighbours || [];

    // Load neighboring tiles dynamically
    setLoadedTiles((prevTiles) => {
      const newTiles = new Set(prevTiles);
      neighbours.forEach((neighbor) => newTiles.add(neighbor));
      return Array.from(newTiles);
    });
  }, []);

  const { camera, raycaster, scene, pointer } = useThree();
  const interactableObjects = useRef([]);

  // Add AxesHelper to visualize axes
  useEffect(() => {
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    return () => {
      scene.remove(axesHelper);
    };
  }, [scene]);

  // Set camera position and orientation
  useEffect(() => {
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    raycaster.near = camera.near;
    raycaster.far = camera.far;

    const intersects = raycaster.intersectObjects(
      interactableObjects.current,
      true,
    );

    for (const intersect of intersects) {
      if (intersect.object.name === "sector") {
        // console.log("Intersection point:", intersect.point);
        setHover([
          Math.round(intersect.point.x),
          0,
          Math.round(intersect.point.z),
        ]);
        break;
      }
    }
  });

  // Adjust texture settings
  if (colorMap && normalMap && roughnessMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

    colorMap.repeat.set(sectorSize / 10, sectorSize / 10);
    normalMap.repeat.set(sectorSize / 10, sectorSize / 10);
    roughnessMap.repeat.set(sectorSize / 10, sectorSize / 120);
  }

  // Map data structure with neighbors
  const mapData = {
    "0x0": {
      neighbours: [
        `0x${sectorSize}`, // Above
        `${sectorSize}x${sectorSize}`, // Top-right
        `${sectorSize}x0`, // Right
        `${sectorSize}x-${sectorSize}`, // Bottom-right
        `0x-${sectorSize}`, // Below
        `-${sectorSize}x-${sectorSize}`, // Bottom-left
        `-${sectorSize}x0`, // Left
        `-${sectorSize}x${sectorSize}`, // Top-left
      ],
    },
  };

  // Helper function to parse coordinates
  const parseCoordinates = (coordString) => {
    const [x, y] = coordString.split("x").map(Number);
    return { x, y };
  };

  function Tile({ position }) {
    const meshRef = useRef();

    useEffect(() => {
      if (meshRef.current) {
        interactableObjects.current.push(meshRef.current);
      }
    }, []);

    // Create geometry rotated to lie in the XZ-plane
    const geometry = useMemo(() => {
      const geom = new THREE.PlaneGeometry(sectorSize, sectorSize, 100, 100);
      geom.rotateX(-Math.PI / 2); // Rotate the plane to lie in the XZ-plane
      return geom;
    }, []);

    return (
      <mesh ref={meshRef} receiveShadow position={position} name="sector">
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
        />
        <primitive object={geometry} attach="geometry" />
      </mesh>
    );
  }

  function Map() {
    // Load new tiles based on the current center tile and its neighbors

    return (
      <>
        {loadedTiles.map((tileKey) => {
          const { x, y } = parseCoordinates(tileKey);
          const position = [x + 0.5, 0, y + 0.5];
          return <Tile key={tileKey} position={position} />;
        })}
      </>
    );
  }

  return (
    <>
      {/* Hovering indicator */}
      <mesh position={hovered}>
        <boxGeometry attach="geometry" args={[1, 0.1, 1]} />
        <meshBasicMaterial color="red" transparent opacity={0.3} />
      </mesh>

      <Map />
    </>
  );
};

export default Terrain;
