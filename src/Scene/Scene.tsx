import React, { useState } from "react";

import Weather from "../Weather/Weather.tsx";
import Sun from "../Lights/Sun/Sun.tsx";
import Terrain from "../Terrain/Terrain.tsx";
import Block from "../Block/Block.tsx";
import { IObject } from "../Interfaces/Object.ts";
import MockPlayer from "../MockPlayer/Player.tsx";
import FlameLight from "../Lights/Flame/Flame.tsx";
import { MapProvider } from "../store/map.tsx";
import { PlayerProvider } from "../store/player.tsx";
import PreGenerated from "../PreGenerated/PreGenerated.tsx";
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

        <MockPlayer />
      </PlayerProvider>
    </MapProvider>
  );
};

export default Scene;
