import { Canvas } from "@react-three/fiber";
import Scene from "./Scene/Scene.tsx";
import { Leva } from "leva";
import AxisHelper from "./Helpers/AxisHelper.tsx";
import { Physics } from "@react-three/cannon";
function App() {
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
        <Physics>
          <Scene />
        </Physics>
      </Canvas>
    </>
  );
}

export default App;
