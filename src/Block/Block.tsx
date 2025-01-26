import { memo, useState } from "react";
import { ITerrainBlock } from "../interfaces/terrain.ts";
import { ThreeEvent } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { color1, color2 } from "../const/colors.ts";

const Block = ({
  position,
  size = { w: 1, h: 1, d: 1 },
  onLeftClick,
}: ITerrainBlock) => {
  const [active, setActive] = useState<boolean>(false);
  const [ref] = useBox(() => ({
    type: "Static",
    mass: 1,
    position: [position.x, position.y, position.z],
    rotation: [-Math.PI / 2, 0, 0],
  }));

  return (
    <>
      <mesh
        ref={ref}
        receiveShadow
        castShadow
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
        <meshStandardMaterial
          attach="material"
          color={active ? color1 : color2}
          transparent={true} // Enable transparency
          opacity={active ? 0.4 : 1}
        />
      </mesh>
    </>
  );
};

export default memo(Block);
