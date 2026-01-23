import { Canvas } from "@react-three/fiber";
import Scene from "./components/scene/scene";
import { Leva } from "leva";
import AxisHelper from "./components/helpers/axis-helper";
import { Debug, Physics } from "@react-three/cannon";
import { useControls } from "leva";
import { MapProvider } from "./store/map-context";
import { PlayerProvider } from "./store/player-context";
import { MiniMap } from "./components/ui/mini-map";

function App() {
  const gravity = useControls("Gravity", {
    x: { value: 0, min: -10, max: 10, step: 0.1 },
    y: { value: -9.8, min: -10, max: 10, step: 0.1 },
    z: { value: 0, min: -10, max: 10, step: 0.1 },
  });

  return (
    <MapProvider>
      <PlayerProvider>
        <Leva />
        <MiniMap size={400} scale={1} />
        <Canvas
          shadows
          camera={{ position: [0, 5, 10], near: 0.1, far: 10000 }}
          style={{ height: "100vh", width: "100vw" }}
          gl={{
            antialias: true,
            logarithmicDepthBuffer: true,
          }}
        >
          <AxisHelper />
          <Physics gravity={[gravity.x, gravity.y, gravity.z]}>
            <Debug>
              <Scene />
            </Debug>
          </Physics>
        </Canvas>
      </PlayerProvider>
    </MapProvider>
  );
}

export default App;
