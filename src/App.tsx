import { Canvas } from "@react-three/fiber";
import Scene from "./Scene/Scene.tsx";
import { Leva } from "leva";
import {} from "@react-three/drei";
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
        <Scene />
      </Canvas>
    </>
  );
}

export default App;
