import { Canvas } from "@react-three/fiber";
import Scene from "./components/scene/scene";
import { Leva } from "leva";
import AxisHelper from "./components/helpers/axis-helper";
import { Debug, Physics } from "@react-three/cannon";
import { useControls } from "leva";
import { MapProvider } from "./store/map-context";
import { PlayerProvider } from "./store/player-context";
import { MiniMap } from "./components/ui/mini-map";
import { DevPanel } from "./components/ui/dev-panel";
import {
  physicsSettings,
  renderSettings,
  cameraSettings,
  debugSettings,
  statsSettings,
} from "./constants/settings";

function App() {
  const gravity = useControls("Gravity", {
    x: { value: physicsSettings.gravity.x, min: -20, max: 20, step: 0.1 },
    y: { value: physicsSettings.gravity.y, min: -20, max: 20, step: 0.1 },
    z: { value: physicsSettings.gravity.z, min: -20, max: 20, step: 0.1 },
  });

  return (
    <MapProvider>
      <PlayerProvider>
        <Leva />
        {debugSettings.showMiniMap && <MiniMap size={400} scale={1} />}
        {statsSettings.enabled && <DevPanel />}
        <Canvas
          shadows={renderSettings.shadowsEnabled}
          camera={{
            position: [0, 5, 10],
            fov: cameraSettings.fov,
            near: cameraSettings.near,
            far: cameraSettings.far,
          }}
          style={{ height: "100vh", width: "100vw" }}
          gl={{
            antialias: renderSettings.antialias,
            logarithmicDepthBuffer: renderSettings.logarithmicDepthBuffer,
          }}
        >
          {debugSettings.showAxisHelper && <AxisHelper />}
          <Physics gravity={[gravity.x, gravity.y, gravity.z]}>
            {debugSettings.showPhysicsDebug ? (
              <Debug>
                <Scene />
              </Debug>
            ) : (
              <Scene />
            )}
          </Physics>
        </Canvas>
      </PlayerProvider>
    </MapProvider>
  );
}

export default App;
