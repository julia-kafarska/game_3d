import { Canvas } from "@react-three/fiber";
import Scene from "./Scene/Scene.tsx";
import { Leva } from "leva";
import AxisHelper from "./Helpers/AxisHelper.tsx";
import { Debug, Physics } from "@react-three/cannon";
import { useControls } from "leva";

function App() {
  const gravity = useControls("Gravity", {
    x: { value: 0, min: -10, max: 10, step: 0.1 },
    y: { value: -9.8, min: -10, max: 10, step: 0.1 },
    z: { value: 0, min: -10, max: 10, step: 0.1 },
  });

  return (
    <>
      <Leva />
      <Canvas
        shadows
        style={{ height: "100vh", width: "100vw" }}
        gl={{
          antialias: true,
        }}
      >
        <AxisHelper />
        <Physics gravity={[gravity.x, gravity.y, gravity.z]}>
          <Debug>
            <Scene />
          </Debug>
        </Physics>
      </Canvas>
    </>
  );
}

export default App;
