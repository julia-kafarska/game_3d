import React, { useState } from "react";

import Weather from "../weather/weather.tsx";
import Sun from "../lights/sun/sun.tsx";
import Terrain from "../terrain/terrain.tsx";
import Block from "../block/block.tsx";
import { IObject } from "../interfaces/object.ts";
import MockPlayer from "../player/player.tsx";
import FlameLight from "../lights/flame/flame.tsx";
import { MapProvider } from "../store/map.tsx";
import { PlayerProvider } from "../store/player.tsx";
import PreGenerated from "../pre_generated/pre_generated.tsx";
const Scene = () => {
  const [objects, setObjects] = useState<IObject[]>([
    // {
    //   position: {
    //     x: 0,
    //     y: 0,
    //     z: 0,
    //   },
    // },
  ]);

  const handleLeftClick = (params: {
    x: number;
    y: number;
    action: string;
    z: number;
  }) => {
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
    <MapProvider>
      <PlayerProvider>
        {/*<Weather />*/}
        <Sun />
        {/*<FlameLight />*/}
        <MockPlayer />
        <Terrain onLeftClick={handleLeftClick} />

        {/*{objects.map((object: IObject) => (*/}
        {/*  <Block*/}
        {/*    position={object.position}*/}
        {/*    key={`${object.position.x}-${object.position.y}-${object.position.z}`}*/}
        {/*    onLeftClick={(params) => {*/}
        {/*      handleLeftClick(params);*/}
        {/*    }}*/}
        {/*  />*/}
        {/*))}*/}
        {/*<PreGenerated*/}
        {/*  position={{*/}
        {/*    x: -2,*/}
        {/*    y: 0,*/}
        {/*    z: 10,*/}
        {/*  }}*/}
        {/*  handleLeftClick={handleLeftClick}*/}
        {/*/>*/}
      </PlayerProvider>
    </MapProvider>
  );
};

export default Scene;
