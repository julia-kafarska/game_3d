import { memo } from "react";
import Block from "../block/block";
import { IPosition } from "../../types/position";

const structure = [
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

interface PreGeneratedProps {
  position: IPosition;
  handleLeftClick: (params: {
    x: number;
    y: number;
    z: number;
    action: string;
  }) => void;
}

const PreGenerated = ({ position, handleLeftClick }: PreGeneratedProps) => {
  return (
    <>
      {structure.map((plane, i) =>
        plane.map((row, j) =>
          row.map((col, k) =>
            col === 1 ? (
              <Block
                position={{
                  z: j - position.z,
                  y: i - position.y,
                  x: k - position.x,
                }}
                key={`${i}${j}${k}`}
                onLeftClick={handleLeftClick}
              />
            ) : null,
          ),
        ),
      )}
    </>
  );
};

export default memo(PreGenerated);
