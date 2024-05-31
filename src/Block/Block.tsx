import { memo, useMemo, useState } from "react";
import { ITerrainBlock } from "../Interfaces/Terrain.ts";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const Block = ({
  position,
  size = { w: 1, h: 1, d: 1 },
  onLeftClick,
}: ITerrainBlock) => {
  const [active, setActive] = useState<boolean>(false);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={position.y > 0}
      castShadow
      position={[position.x, position.y, position.z]}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setActive(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setActive(false);
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e?.face?.normal) {
          const res = {
            x: position.x,
            y: position.y,
            z: position.z,
            action: "1",
          };

          if (e.face.normal.x !== 0) {
            res.x = res.x + e.face.normal.x;
          } else if (e.face.normal.y !== 0) {
            res.z = res.z - e.face.normal.y;
          } else if (e.face.normal.z !== 0) {
            res.y = res.y + e.face.normal.z;
          }
          onLeftClick(res);
        }
      }}
      onContextMenu={() => {}}
    >
      <boxGeometry attach="geometry" args={[size.w, size.h, size.d]} />
      <meshStandardMaterial attach="material" color={"white"} />
    </mesh>
  );
};

export default memo(Block);