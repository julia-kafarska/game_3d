import { useEffect, useRef } from "react";
import { usePlayerContext } from "../../store/player-context";
import { useTerrainStore } from "../../store/terrain-store";
import { useDevStore } from "../../store/dev-store";
import { sectorSize } from "../../constants/settings";

interface MiniMapProps {
  size?: number;
  scale?: number; // World units per pixel
}

// Height thresholds (matching terrain tile.tsx)
const HEIGHT_WATER = -2;
const HEIGHT_SAND = -0.5;
const HEIGHT_GRASS = 2;
const HEIGHT_ROCK = 4;

// Colors matching terrain tile.tsx
const colors = {
  water: { r: 0x34, g: 0x98, b: 0xdb },
  sand: { r: 0xf4, g: 0xd0, b: 0x3f },
  grass: { r: 0x2e, g: 0xcc, b: 0x71 },
  hill: { r: 0x8b, g: 0x73, b: 0x55 },
  rock: { r: 0x7f, g: 0x8c, b: 0x8d },
  snow: { r: 0xec, g: 0xf0, b: 0xf1 },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number,
): string {
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r},${g},${b})`;
}

function getColorForHeight(height: number): string {
  if (height < HEIGHT_WATER) {
    return lerpColor(colors.water, colors.water, 0);
  } else if (height < HEIGHT_SAND) {
    const t = (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    return lerpColor(colors.water, colors.sand, t);
  } else if (height < HEIGHT_GRASS) {
    const t = (height - HEIGHT_SAND) / (HEIGHT_GRASS - HEIGHT_SAND);
    return lerpColor(colors.sand, colors.grass, t);
  } else if (height < HEIGHT_ROCK) {
    const t = (height - HEIGHT_GRASS) / (HEIGHT_ROCK - HEIGHT_GRASS);
    return lerpColor(colors.grass, colors.hill, t);
  } else if (height < 6) {
    const t = (height - HEIGHT_ROCK) / 2;
    return lerpColor(colors.hill, colors.rock, Math.min(t, 1));
  } else {
    const t = (height - 6) / 2;
    return lerpColor(colors.rock, colors.snow, Math.min(t, 1));
  }
}

export function MiniMap({ size = 200, scale = 2 }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { player } = usePlayerContext();
  const sectorsMap = useTerrainStore((state) => state.sectors);
  const sectors = Array.from(sectorsMap.values());
  const speedMultiplier = useDevStore((state) => state.speedMultiplier);
  const devSpeedEnabled = speedMultiplier > 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = size / 2;
    const centerZ = size / 2;
    const radius = size / 2 - 2;
    const playerX = player.position.x;
    const playerZ = player.position.z;
    const playerAngle = player.rotation || 0;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Create circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerZ, radius, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, size, size);

    // Draw terrain sectors
    sectors.forEach((sector) => {
      if (!sector.heightmap) return;

      const resolution = Math.sqrt(sector.heightmap.length);
      const step = sectorSize / resolution;

      for (let z = 0; z < resolution; z++) {
        for (let x = 0; x < resolution; x++) {
          const heightIndex = z * resolution + x;
          const height = sector.heightmap[heightIndex];

          // World position of this heightmap point
          const worldX = sector.worldX + x * step;
          const worldZ = sector.worldZ + z * step;

          // Position relative to player
          const relX = worldX - playerX;
          const relZ = worldZ - playerZ;

          // Rotate relative position by player angle so forward is always up
          const cosA = Math.cos(playerAngle);
          const sinA = Math.sin(playerAngle);
          const rotatedX = relX * cosA - relZ * sinA;
          const rotatedZ = relX * sinA + relZ * cosA;

          // Screen position
          const screenX = centerX + rotatedX / scale;
          const screenZ = centerZ + rotatedZ / scale;

          // Skip if outside circle bounds
          const distFromCenter = Math.sqrt(
            Math.pow(screenX - centerX, 2) + Math.pow(screenZ - centerZ, 2),
          );
          if (distFromCenter > radius) {
            continue;
          }

          ctx.fillStyle = getColorForHeight(height);
          const pixelSize = Math.max(1, step / scale);
          ctx.fillRect(screenX, screenZ, pixelSize, pixelSize);
        }
      }
    });

    // Draw player position (center)
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(centerX, centerZ, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw player direction indicator (always points up since map rotates with player)
    const dirLength = 14;
    ctx.strokeStyle = "#e74c3c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerZ - 6);
    ctx.lineTo(centerX, centerZ - dirLength - 6);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(centerX, centerZ - dirLength - 8);
    ctx.lineTo(centerX - 5, centerZ - dirLength);
    ctx.lineTo(centerX + 5, centerZ - dirLength);
    ctx.closePath();
    ctx.fillStyle = "#e74c3c";
    ctx.fill();

    ctx.restore();

    // Draw circular border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerZ, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw compass rose (rotates with player so directions stay true to world)
    const compassRadius = radius - 15;
    const directions = [
      { label: "N", angle: 0 },
      { label: "E", angle: Math.PI / 2 },
      { label: "S", angle: Math.PI },
      { label: "W", angle: -Math.PI / 2 },
    ];

    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    directions.forEach(({ label, angle }) => {
      // Rotate direction by player angle to show true world direction
      const rotatedAngle = angle + playerAngle;
      const x = centerX + Math.sin(rotatedAngle) * compassRadius;
      const y = centerZ - Math.cos(rotatedAngle) * compassRadius;

      // Draw background circle for better visibility
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Draw direction label
      ctx.fillStyle = label === "N" ? "#e74c3c" : "#ffffff";
      ctx.fillText(label, x, y);
    });

    // Draw coordinates at bottom
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(centerX - 60, size - 22, 120, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px monospace";
    ctx.fillText(
      `X: ${Math.round(playerX)} Z: ${Math.round(playerZ)}`,
      centerX,
      size - 12,
    );
  }, [player, sectors, size, scale]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        right: 10,
        zIndex: 1000,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          boxShadow: "0 2px 15px rgba(0,0,0,0.7)",
        }}
      />
      {devSpeedEnabled && (
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            background: "#e74c3c",
            color: "white",
            padding: "2px 6px",
            borderRadius: 3,
            fontSize: 10,
            fontWeight: "bold",
          }}
        >
          x20 SPEED
        </div>
      )}
      <div
        style={{
          color: "#888",
          fontSize: 10,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        Press P to toggle speed
      </div>
    </div>
  );
}
