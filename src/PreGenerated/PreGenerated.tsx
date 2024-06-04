import { memo } from "react";
import Block from "../Block/Block.tsx";

const cas = [
  [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1],
  ],
];
const PreGenerated = ({ position, handleLeftClick }) => {
  return cas.map((plane, i) =>
    plane.map((row, j) =>
      row.map((col, k) =>
        col === 1 ? (
          <Block
            position={{
              z: j + position.z,
              y: i + position.y,
              x: k + position.x,
            }}
            key={`${i}${j}${k}`}
            onLeftClick={handleLeftClick}
          />
        ) : null,
      ),
    ),
  );
};

export default memo(PreGenerated);
