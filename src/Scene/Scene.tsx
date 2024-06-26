import { useState } from "react";

import Weather from "../Weather/Weather.tsx";
import Sun from "../Lights/Sun/Sun.tsx";
import Terrain from "../Terrain/Terrain.tsx";
import Block from "../Block/Block.tsx";
import { ILeftClickParams } from "../Interfaces/Terrain.ts";
import { IObject } from "../Interfaces/Object.ts";
import MockPlayer from "../MockPlayer/Player.tsx";
import { useGamepad } from "../gameControllers/padHook.ts";
import FlameLight from "../Lights/Flame/Flame.tsx";
import PreGenerated from "../PreGenerated/PreGenerated.tsx";
const Scene = () => {
  const [objects, setObjects] = useState<IObject[]>([
    {
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
  ]);

  // const { map, addSector } = useMapStore();

  const gamepad = useGamepad();

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
      },
    ]);
  };

  return (
    <>
      <Weather />
      <Sun />
      <FlameLight />
      <Terrain
        onLeftClick={handleLeftClick}
        position={{
          x: 0,
          y: 0,
          z: 0,
        }}
      />

      {objects.map((object: IObject) => (
        <Block
          position={object.position}
          key={`${object.position.x}-${object.position.y}-${object.position.z}`}
          onLeftClick={handleLeftClick}
        />
      ))}
      <PreGenerated
        position={{
          x: -2,
          y: 0,
          z: 10,
        }}
        handleLeftClick={handleLeftClick}
      />
      <MockPlayer position={[0, 1, 0]} gamepad={gamepad} />
    </>
  );
};

export default Scene;
