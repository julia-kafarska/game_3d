import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useStatsStore } from "../../store/stats-store";

// This component runs inside the Canvas and collects performance stats
// It doesn't render anything - just updates the stats store
export function StatsCollector() {
  const { gl } = useThree();
  const updateStats = useStatsStore((state) => state.updateStats);

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const updateIntervalRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    const frameTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Keep last 60 frame times for averaging
    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Update stats every 10 frames to reduce overhead
    updateIntervalRef.current++;
    if (updateIntervalRef.current >= 10) {
      updateIntervalRef.current = 0;

      const avgFrameTime =
        frameTimesRef.current.reduce((a, b) => a + b, 0) /
        frameTimesRef.current.length;
      const fps = 1000 / avgFrameTime;

      // Get memory info if available
      let memory: number | null = null;
      if ((performance as any).memory) {
        memory = (performance as any).memory.usedJSHeapSize / 1048576;
      }

      // Get render info
      const info = gl.info;

      updateStats({
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        memory,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      });
    }
  });

  return null;
}
