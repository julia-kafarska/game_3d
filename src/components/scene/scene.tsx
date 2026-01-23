import { useState } from "react";

import Sun from "../lights/sun";
import Terrain from "../terrain/terrain";
import Block from "../block/block";
import { IObject } from "../../types/object";
import Player from "../../player/player";
import PreGenerated from "../pre-generated/pre-generated";
import { Sky } from "../sky/sky";
import { Moon } from "../sky/moon";
import { Fog } from "../atmosphere/fog";
import { Clouds } from "../atmosphere/clouds";
import { WaterPlane } from "../water/water-plane";

const Scene = () => {
  const [objects, setObjects] = useState<IObject[]>([
    {
      position: {
        x: 1,
        y: 1,
        z: 1,
      },
    },
  ]);

  const handleLeftClick = (params: {
    x: number;
    y: number;
    action: string;
    z: number;
  }) => {
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
      <Sky />
      <Sun />
      <Moon />
      <Fog />
      <Clouds />
      <WaterPlane />
      {/*<FlameLight />*/}
      <Player />
      <Terrain onLeftClick={handleLeftClick} />

      {objects.map((object: IObject) => (
        <Block
          position={object.position}
          key={`${object.position.x}-${object.position.y}-${object.position.z}`}
          onLeftClick={(params) => {
            handleLeftClick(params);
          }}
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
    </>
  );
};

export default Scene;
