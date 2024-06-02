import { useState } from "react";

import Weather from "../Weather/Weather.tsx";
import Sun from "../Lights/Sun/Sun.tsx";
import Terrain from "../Terrain/Terrain.tsx";
import Block from "../Block/Block.tsx";
import { ILeftClickParams } from "../Interfaces/Terrain.ts";
import { IObject } from "../Interfaces/Object.ts";
import MockPlayer from "../MockPlayer/Player.tsx";
import { useGamepad } from "../gameControllers/padHook.ts";
// import Castle from "../Castle/Castle.tsx";
import FlameLight from "../Lights/Flame/Flame.tsx";

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
      {/*<Castle />*/}
      <FlameLight />
      <Terrain onLeftClick={handleLeftClick} />
      {objects.map((object: IObject) => (
        <Block
          position={object.position}
          key={`${object.position.x}-${object.position.y}-${object.position.z}`}
          onLeftClick={handleLeftClick}
        />
      ))}
      <MockPlayer position={[0, 1, 0]} gamepad={gamepad} />

      {/*<Flame />*/}
      {/*<Player />*/}
    </>
  );
};

export default Scene;
