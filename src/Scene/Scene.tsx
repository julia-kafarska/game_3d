import { useState } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

import Weather from "../Weather/Weather.tsx";
import Sun from "../Lights/Sun/Sun.tsx";
import Terrain from "../Terrain/Terrain.tsx";
import Block from "../Block/Block.tsx";
import { ILeftClickParams } from "../Interfaces/Terrain.ts";
import { IObject } from "../Interfaces/Object.ts";

const Scene = () => {
  const [objects, setObjects] = useState<IObject[]>([
    {
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
      size: {
        w: 1,
        h: 1,
        d: 1,
      },
    },
  ]);

  const handleLeftClick = (params: ILeftClickParams) => {
    // TODO check if block exists in this position
    setObjects((prevObjects: IObject[]) => [
      ...prevObjects,
      {
        position: {
          x: params.x,
          y: params.y,
          z: params.z,
        },
        size: {
          w: 1,
          h: 1,
          d: 1,
        },
      },
    ]);
  };

  return (
    <>
      <Weather />
      <Sun />
      <Terrain onLeftClick={handleLeftClick} />
      {objects.map((object: IObject) => (
        <Block
          position={object.position}
          key={`${object.position.x}-${object.position.y}-${object.position.z}`}
          onLeftClick={handleLeftClick}
        />
      ))}
      {/*<Flame />*/}
      {/*<Player />*/}
      {/*<Suspense fallback={<Loader />}>*/}
      {/*  <Model url="../../models/fire/scene.gltf" position={[3, 0, 10]} />*/}
      {/*</Suspense>*/}
      <PerspectiveCamera position={[12, 12, 12]} makeDefault />
      <OrbitControls
        minDistance={5}
        maxDistance={70}
        minPolarAngle={0}
        maxPolarAngle={1}
      />
    </>
  );
};

export default Scene;
