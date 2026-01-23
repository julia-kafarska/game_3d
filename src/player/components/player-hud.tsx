import { Html } from "@react-three/drei";
import { IPosition } from "../../types/position";

interface PlayerHudProps {
  position: IPosition;
}

export function PlayerHud({ position }: PlayerHudProps) {
  return (
    <Html>
      <div
        style={{
          background: "rgba(255,0,0, 0.2)",
          width: "100px",
          height: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        {`x: ${Math.round(position.x)}, z: ${Math.round(position.z)}`}
      </div>
    </Html>
  );
}
