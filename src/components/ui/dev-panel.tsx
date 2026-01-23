import { useEffect, useRef, useState } from "react";
import { usePlayerContext } from "../../store/player-context";
import { useCameraStore } from "../../store/camera-store";
import { useTerrainStore } from "../../store/terrain-store";
import { useStatsStore } from "../../store/stats-store";
import { useDevStore } from "../../store/dev-store";

// Mini 3D orientation indicator component
function OrientationIndicator({ rotation }: { rotation: number }) {
  const size = 50;
  const axisLength = 18;
  const rotationDeg = (rotation * 180) / Math.PI;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        margin: "0 auto",
        perspective: "100px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(25deg) rotateY(${-rotationDeg}deg)`,
        }}
      >
        {/* X axis (red) - points right */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: axisLength,
            height: 2,
            backgroundColor: "#ef4444",
            transformOrigin: "0 50%",
            transform: "translateY(-50%)",
            boxShadow: "0 0 3px rgba(239, 68, 68, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(50% + ${axisLength}px)`,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#ef4444",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          X
        </div>

        {/* Z axis (blue) - points forward */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2,
            height: axisLength,
            backgroundColor: "#3b82f6",
            transformOrigin: "50% 0",
            transform: "translateX(-50%) rotateX(90deg)",
            boxShadow: "0 0 3px rgba(59, 130, 246, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `calc(50% - ${axisLength + 4}px)`,
            transform: "translateX(-50%)",
            color: "#3b82f6",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          Z
        </div>

        {/* Y axis (green) - points up */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 2,
            height: axisLength,
            backgroundColor: "#22c55e",
            transformOrigin: "50% 100%",
            transform: "translateX(-50%) translateY(-100%)",
            boxShadow: "0 0 3px rgba(34, 197, 94, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "calc(50% + 6px)",
            top: `calc(50% - ${axisLength + 4}px)`,
            color: "#22c55e",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          Y
        </div>

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 4,
            height: 4,
            backgroundColor: "#fff",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}

export function DevPanel() {
  const { player } = usePlayerContext();
  const cameraMode = useCameraStore((state) => state.mode);
  const sectors = useTerrainStore((state) => state.sectors);
  const stats = useStatsStore((state) => state.stats);
  const { speedMultiplier } = useDevStore();

  const [speed, setSpeed] = useState(0);
  const lastPosRef = useRef({ x: 0, y: 0, z: 0 });
  const lastTimeRef = useRef(performance.now());

  // Calculate speed from position changes
  useEffect(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000; // seconds

    if (dt > 0) {
      const dx = player.position.x - lastPosRef.current.x;
      const dy = player.position.y - lastPosRef.current.y;
      const dz = player.position.z - lastPosRef.current.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const currentSpeed = distance / dt;

      // Smooth the speed value
      setSpeed((prev) => prev * 0.8 + currentSpeed * 0.2);
    }

    lastPosRef.current = { ...player.position };
    lastTimeRef.current = now;
  }, [player.position]);

  const cameraModeNames = ["", "Third-Person", "Isometric", "First-Person"];
  const isDevSpeed = speedMultiplier > 1;

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        backgroundColor: "#1a1a1a",
        color: "#fff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "11px",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        zIndex: 1000,
        minWidth: "200px",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#007bff",
          padding: "8px 12px",
          fontWeight: 600,
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Dev Panel
      </div>

      {/* Performance Section */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #333" }}>
        <div
          style={{
            color: "#888",
            fontSize: "10px",
            marginBottom: "6px",
            textTransform: "uppercase",
          }}
        >
          Performance
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>FPS</span>
          <span
            style={{
              color:
                stats.fps >= 55
                  ? "#4ade80"
                  : stats.fps >= 30
                    ? "#fbbf24"
                    : "#ef4444",
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            {stats.fps}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Frame</span>
          <span style={{ fontFamily: "monospace" }}>{stats.frameTime}ms</span>
        </div>
        {stats.memory !== null && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span style={{ color: "#aaa" }}>Memory</span>
            <span style={{ fontFamily: "monospace" }}>
              {Math.round(stats.memory)}MB
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Draw Calls</span>
          <span style={{ fontFamily: "monospace" }}>{stats.drawCalls}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#aaa" }}>Triangles</span>
          <span style={{ fontFamily: "monospace" }}>
            {stats.triangles.toLocaleString()}
          </span>
        </div>
      </div>

      {/* World Section */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #333" }}>
        <div
          style={{
            color: "#888",
            fontSize: "10px",
            marginBottom: "6px",
            textTransform: "uppercase",
          }}
        >
          World
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Sectors</span>
          <span style={{ fontFamily: "monospace" }}>{sectors.length}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#aaa" }}>Geometries</span>
          <span style={{ fontFamily: "monospace" }}>{stats.geometries}</span>
        </div>
      </div>

      {/* Player Section */}
      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            color: "#888",
            fontSize: "10px",
            marginBottom: "6px",
            textTransform: "uppercase",
          }}
        >
          Player
        </div>

        {/* Orientation Indicator */}
        <div style={{ marginBottom: "10px" }}>
          <OrientationIndicator rotation={player.rotation} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>X</span>
          <span style={{ fontFamily: "monospace" }}>
            {player.position.x.toFixed(1)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Y</span>
          <span style={{ fontFamily: "monospace" }}>
            {player.position.y.toFixed(1)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Z</span>
          <span style={{ fontFamily: "monospace" }}>
            {player.position.z.toFixed(1)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Rotation</span>
          <span style={{ fontFamily: "monospace" }}>
            {((player.rotation * 180) / Math.PI).toFixed(0)}°
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "#aaa" }}>Speed</span>
          <span style={{ fontFamily: "monospace" }}>
            {speed.toFixed(1)} u/s
            {isDevSpeed && (
              <span style={{ color: "#fbbf24", marginLeft: "4px" }}>(DEV)</span>
            )}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#aaa" }}>Camera</span>
          <span>{cameraModeNames[cameraMode]}</span>
        </div>
      </div>
    </div>
  );
}
