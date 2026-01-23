# 3D Game Engine Documentation

> **Last Updated:** 2026-01-23 20:45 UTC

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Game Mechanics](#game-mechanics)
4. [Map & Terrain Rendering](#map--terrain-rendering)
5. [Steering & Movement Controls](#steering--movement-controls)
6. [Camera System](#camera-system)
7. [Objects System](#objects-system)
8. [Performance Optimizations](#performance-optimizations)
9. [Configuration Reference](#configuration-reference)

---

## Project Overview

This is a 3D open-world exploration game built with React Three Fiber (R3F), featuring procedurally generated infinite terrain, dynamic day/night cycles, and third-person character controls.

### Tech Stack

| Technology          | Purpose                       |
| ------------------- | ----------------------------- |
| React 18            | UI framework                  |
| React Three Fiber   | React renderer for Three.js   |
| Three.js v0.164.1   | 3D rendering engine           |
| Zustand             | Global state management       |
| @react-three/cannon | Physics engine (Cannon.js)    |
| @react-three/drei   | Reusable 3D utilities         |
| simplex-noise       | Procedural terrain generation |
| Vite + TypeScript   | Build tooling                 |
| Leva                | Debug UI controls             |

### Project Structure

```
src/
├── player/                 # Player character and controls
│   ├── player.tsx         # Main player component
│   ├── use-keyboard-input.ts
│   ├── use-mouse-look.ts
│   ├── use-player-animation.ts
│   └── use-player-movement.ts
├── components/
│   ├── terrain/           # Terrain tile rendering
│   ├── lights/            # Sun, moon, ambient lighting
│   ├── sky/               # Sky and atmosphere
│   ├── atmosphere/        # Fog, clouds
│   ├── water/             # Water plane
│   ├── camera/            # Third-person camera
│   ├── objects/           # Sector objects (trees, rocks)
│   └── ui/                # Mini-map, HUD
├── terrain/
│   ├── generation/        # Terrain generation algorithms
│   ├── hooks/             # Sector management hooks
│   └── db/                # IndexedDB persistence
├── store/                 # Zustand state stores
├── types/                 # TypeScript interfaces
└── constants/             # Game settings
```

---

## Architecture

### Application Flow

```
main.tsx
    └── app.tsx
        └── Canvas (R3F)
            ├── Physics (Cannon.js)
            ├── MapProvider (terrain context)
            └── PlayerProvider (player context)
                └── scene.tsx
                    ├── Sky + Sun/Moon
                    ├── Lighting
                    ├── Terrain Sectors
                    ├── Sector Objects
                    ├── Player + Camera
                    └── Water
```

### Core Game Loop

1. **Frame Update**: R3F's `useFrame` hook triggers each animation frame
2. **Input Processing**: Keyboard and mouse input hooks capture player intent
3. **Physics Step**: Cannon.js advances physics simulation by delta time
4. **Terrain Query**: Player Y-position sampled from heightmap
5. **State Update**: Zustand stores update with new positions
6. **Render**: Three.js renders the scene with updated transforms

### State Management

| Store              | Purpose                           | Location                         |
| ------------------ | --------------------------------- | -------------------------------- |
| `useTerrainStore`  | Loaded sectors, heightmap queries | `store/terrain-store.ts`         |
| `useDayNightStore` | Time of day, cycle speed          | `store/day-night-store.ts`       |
| `useCameraStore`   | Camera mode (1/2/3)               | `store/camera-store.ts`          |
| `useStatsStore`    | Performance stats visibility      | `store/stats-store.ts`           |
| `useDevStore`      | Dev speed multiplier              | `store/dev-store.ts`             |
| `PlayerContext`    | Player position, rotation         | `player/player-context.tsx`      |
| `MapContext`       | Terrain-related context           | `components/map/map-context.tsx` |

---

## Game Mechanics

### Physics System

The game uses **@react-three/cannon** (Cannon.js wrapper) for physics simulation.

**Configuration** (`app.tsx`):

```typescript
<Physics gravity={[gravityX, gravityY, gravityZ]}>
```

- **Default Gravity**: `[0, -9.8, 0]` (Earth-like)
- **Adjustable**: Via Leva debug panel

**Player Physics Body** (`player.tsx`):

```typescript
const [ref, api] = useBox(() => ({
  mass: 1,
  position: [0, 10, 0],
  args: [0.5, 1.8, 0.5], // Capsule approximation
  type: "Dynamic",
}));
```

### Animation System

**Location**: `player/use-player-animation.ts`

The player character uses a rigged 3D model (`xbot.glb`) with multiple animation clips.

**Animation States**:
| State | Trigger | Transition Time |
|-------|---------|-----------------|
| Idle | No movement keys | 0.2s fade |
| Walk | WASD pressed | 0.2s fade |
| Run | WASD + Shift | 0.2s fade |

**Animation Logic**:

```typescript
// Determine current animation based on input
if (isMoving) {
  targetAnimation = isRunning ? "Run" : "Walk";
} else {
  targetAnimation = "Idle";
}

// Smooth transition
previousAction.fadeOut(0.2);
newAction.reset().fadeIn(0.2).play();
```

**Direction Handling**:

- Forward movement: `timeScale = 1`
- Backward movement: `timeScale = -1` (animation plays in reverse)

### Day/Night Cycle

**Location**: `store/day-night-store.ts`

**Time System**:

- Range: `0.0` (midnight) to `1.0` (next midnight)
- Noon: `0.5`
- Cycle Speed: `1.0` = 24 real minutes for full day

**Sun Position Calculation** (`lights/sun.tsx`):

```typescript
const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2;
const sunX = Math.cos(sunAngle) * SUN_ORBIT_RADIUS;
const sunY = Math.sin(sunAngle) * SUN_ORBIT_RADIUS;
```

**Lighting Changes**:
| Time | Sun Color | Intensity | Ambient |
|------|-----------|-----------|---------|
| Dawn (0.2-0.3) | Orange | Rising | Warm |
| Noon (0.5) | White | Maximum | Bright |
| Dusk (0.7-0.8) | Orange | Falling | Warm |
| Night (0.0/1.0) | Off | 0 | Dark blue |

---

## Map & Terrain Rendering

### Sector-Based World

The world is divided into **sectors** - square chunks of terrain that load/unload dynamically based on player position.

**Key Parameters** (`constants/settings.ts`):

```typescript
export const SETTINGS = {
  sectorSize: 100, // World units per sector
  heightmapResolution: 64, // Grid points per sector (64x64)
  loadDistance: 2, // Load sectors within 2 sectors
  unloadDistance: 4, // Unload beyond 4 sectors
};
```

**Sector Coordinate System**:

```
World Position → Sector Coordinate
(150, 0, 250) → sectorX: 1, sectorZ: 2 (at sectorSize: 100)
```

### Terrain Generation Pipeline

**Location**: `terrain/generation/terrain-generator.ts`

The terrain uses **procedural noise** to generate infinite, deterministic landscapes.

#### 1. Base Terrain (Fractal Brownian Motion)

```typescript
function fbm(
  x: number,
  z: number,
  octaves: number,
  persistence: number,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}
```

**Parameters**:

- `octaves: 4` - Layers of detail
- `persistence: 0.5` - Each octave is half the amplitude
- `frequency: 0.012` - Base noise scale

#### 2. Mountain Ridges (Ridged Noise)

```typescript
function ridgedNoise(x: number, z: number): number {
  const n = noise2D(x, z);
  return 1 - Math.abs(n); // Invert absolute value for sharp ridges
}
```

#### 3. Continental Shape

Large-scale variation that creates distinct landmasses:

```typescript
function getContinentalValue(x: number, z: number): number {
  return noise2D(x * 0.001, z * 0.001); // Very low frequency
}
```

#### 4. Domain Warping

Adds organic, natural-looking distortion:

```typescript
function warpedCoords(x: number, z: number): [number, number] {
  const warpX = noise2D(x * 0.01, z * 0.01) * warpStrength;
  const warpZ = noise2D(x * 0.01 + 100, z * 0.01 + 100) * warpStrength;
  return [x + warpX, z + warpZ];
}
```

#### 5. Final Height Calculation

```typescript
function getHeight(worldX: number, worldZ: number): number {
  const [wx, wz] = warpedCoords(worldX, worldZ);

  const base = fbm(wx, wz, octaves, persistence) * terrainAmplitude;
  const mountains = ridgedNoise(wx * 0.02, wz * 0.02) * mountainAmplitude;
  const continental = getContinentalValue(worldX, worldZ);

  // Blend based on continental value
  const mountainBlend = Math.max(0, continental - 0.3) * 2;

  return base + mountains * mountainBlend;
}
```

### Biome System

**8 Biome Types**:

1. **Water** - Below sea level
2. **Beach** - Sea level transition
3. **Desert** - Low moisture, high temperature
4. **Savanna** - Moderate moisture, warm
5. **Plains** - Temperate grassland
6. **Forest** - High moisture
7. **Hills** - Elevated terrain
8. **Mountains** - High altitude
9. **Tundra** - Very high altitude, cold

**Biome Determination** (`terrain-generator.ts`):

```typescript
function determineBiome(
  height: number,
  moisture: number,
  temperature: number,
): BiomeType {
  if (height < WATER_LEVEL) return "water";
  if (height < WATER_LEVEL + 2) return "beach";

  if (height > MOUNTAIN_THRESHOLD) return "mountains";
  if (height > HILL_THRESHOLD) return "hills";

  if (moisture < 0.2) return temperature > 0.6 ? "desert" : "tundra";
  if (moisture < 0.5) return "savanna";
  if (moisture < 0.7) return "plains";
  return "forest";
}
```

**Moisture & Temperature**:

- Moisture: Separate simplex noise layer
- Temperature: Decreases with altitude (lapse rate)

### Heightmap Storage & Interpolation

**Heightmap Format**:

```typescript
interface ISector {
  heightmap: Float32Array; // 64x64 = 4096 values
  biomeMap: Uint8Array; // Biome type per vertex
  objects: ISectorObject[];
  createdAt: number;
}
```

**Bilinear Interpolation** (`terrain-store.ts`):

```typescript
function getHeightAtPosition(worldX: number, worldZ: number): number {
  // Find sector and local position
  const sectorX = Math.floor(worldX / sectorSize);
  const sectorZ = Math.floor(worldZ / sectorSize);
  const localX = worldX - sectorX * sectorSize;
  const localZ = worldZ - sectorZ * sectorSize;

  // Get grid indices
  const gridX = (localX / sectorSize) * (resolution - 1);
  const gridZ = (localZ / sectorSize) * (resolution - 1);

  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, resolution - 1);
  const z1 = Math.min(z0 + 1, resolution - 1);

  // Interpolation weights
  const fx = gridX - x0;
  const fz = gridZ - z0;

  // Sample four corners
  const h00 = heightmap[z0 * resolution + x0];
  const h10 = heightmap[z0 * resolution + x1];
  const h01 = heightmap[z1 * resolution + x0];
  const h11 = heightmap[z1 * resolution + x1];

  // Bilinear interpolation
  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  return h0 * (1 - fz) + h1 * fz;
}
```

### Tile Rendering

**Location**: `components/terrain/tile.tsx`

Each sector renders as a single mesh with vertex-based height and color.

```typescript
function Tile({ sector }: { sector: ILoadedSector }) {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(
      sectorSize,
      sectorSize,
      resolution - 1,
      resolution - 1
    );

    // Apply heightmap to vertices
    const positions = geo.attributes.position.array;
    for (let i = 0; i < sector.heightmap.length; i++) {
      positions[i * 3 + 2] = sector.heightmap[i]; // Z becomes height after rotation
    }

    // Vertex colors from biome
    const colors = new Float32Array(sector.heightmap.length * 3);
    for (let i = 0; i < sector.biomeMap.length; i++) {
      const color = getBiomeColor(sector.biomeMap[i], sector.heightmap[i]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3));

    geo.computeVertexNormals();
    return geo;
  }, [sector]);

  return (
    <mesh
      geometry={geometry}
      position={[sector.worldX, 0, sector.worldZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial vertexColors roughness={0.8} />
    </mesh>
  );
}
```

### Sector Loading/Unloading

**Location**: `terrain/hooks/use-sector-manager.ts`

```typescript
function useSectorManager() {
  const playerPosition = usePlayerPosition();
  const { loadedSectors, loadSector, unloadSector } = useTerrainStore();

  useEffect(() => {
    const playerSectorX = Math.floor(playerPosition.x / sectorSize);
    const playerSectorZ = Math.floor(playerPosition.z / sectorSize);

    // Load nearby sectors
    for (let dx = -loadDistance; dx <= loadDistance; dx++) {
      for (let dz = -loadDistance; dz <= loadDistance; dz++) {
        const key = `${playerSectorX + dx}x${playerSectorZ + dz}`;
        if (!loadedSectors.has(key)) {
          loadSector(playerSectorX + dx, playerSectorZ + dz);
        }
      }
    }

    // Unload distant sectors
    for (const [key, sector] of loadedSectors) {
      const distance = Math.max(
        Math.abs(sector.sectorX - playerSectorX),
        Math.abs(sector.sectorZ - playerSectorZ),
      );
      if (distance > unloadDistance) {
        unloadSector(key);
      }
    }
  }, [playerPosition]);
}
```

### IndexedDB Persistence

**Location**: `terrain/db/terrain-db.ts`

Generated sectors are cached in IndexedDB to avoid regeneration.

```typescript
const DB_NAME = "terrain-db";
const STORE_NAME = "sectors";

async function saveSector(sector: ISector): Promise<void> {
  const db = await openDB(DB_NAME, 1);
  await db.put(STORE_NAME, sector, sector.key);
}

async function getSector(key: string): Promise<ISector | undefined> {
  const db = await openDB(DB_NAME, 1);
  return db.get(STORE_NAME, key);
}

async function hasSector(key: string): Promise<boolean> {
  const db = await openDB(DB_NAME, 1);
  const sector = await db.get(STORE_NAME, key);
  return sector !== undefined;
}
```

---

## Steering & Movement Controls

### Input System

**Location**: `player/use-keyboard-input.ts`

**Key Bindings**:
| Key | Action |
|-----|--------|
| W | Move forward |
| S | Move backward |
| A | Rotate left |
| D | Rotate right |
| Shift | Sprint (hold) |
| P | Toggle dev speed (20x) |
| 1 | Camera mode 1 (Third-person) |
| 2 | Camera mode 2 (Isometric) |
| 3 | Camera mode 3 (First-person) |
| V | Cycle camera mode (1→2→3→1) |
| F | Toggle performance stats panel |

**Implementation**:

```typescript
function useKeyboardInput() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          setKeys((k) => ({ ...k, forward: true }));
          break;
        case "KeyS":
          setKeys((k) => ({ ...k, backward: true }));
          break;
        case "KeyA":
          setKeys((k) => ({ ...k, left: true }));
          break;
        case "KeyD":
          setKeys((k) => ({ ...k, right: true }));
          break;
        case "ShiftLeft":
          setKeys((k) => ({ ...k, sprint: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Mirror key releases...
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}
```

### Movement System

**Location**: `player/use-player-movement.ts`

**Speed Constants**:

```typescript
const BASE_SPEED = 0.022; // Units per frame
const SPRINT_MULTIPLIER = 3; // 3x when sprinting
const DEV_MULTIPLIER = 20; // 20x in dev mode
const ROTATION_SPEED = 0.03; // Radians per frame
```

**Movement Calculation**:

```typescript
function usePlayerMovement() {
  const keys = useKeyboardInput();
  const { position, rotation, updatePlayer } = usePlayerContext();
  const getHeightAt = useTerrainStore((s) => s.getHeightAtPosition);

  useFrame((_, delta) => {
    let speed = BASE_SPEED;
    if (keys.sprint) speed *= SPRINT_MULTIPLIER;
    if (devMode) speed *= DEV_MULTIPLIER;

    // Rotation
    let newRotation = rotation;
    if (keys.left) newRotation += ROTATION_SPEED;
    if (keys.right) newRotation -= ROTATION_SPEED;

    // Movement direction
    let dx = 0,
      dz = 0;
    if (keys.forward) {
      dx += Math.sin(newRotation) * speed;
      dz += Math.cos(newRotation) * speed;
    }
    if (keys.backward) {
      dx -= Math.sin(newRotation) * speed;
      dz -= Math.cos(newRotation) * speed;
    }

    // New position
    const newX = position.x + dx;
    const newZ = position.z + dz;
    const newY = getHeightAt(newX, newZ) + PLAYER_HEIGHT_OFFSET;

    updatePlayer({
      position: { x: newX, y: newY, z: newZ },
      rotation: newRotation,
    });
  });
}
```

### Mouse Look

**Location**: `player/use-mouse-look.ts`

**Parameters**:

```typescript
const SENSITIVITY = 0.003;
const MIN_PITCH = -0.3; // Look up limit (radians)
const MAX_PITCH = 1.0; // Look down limit (radians)
```

**Implementation**:

```typescript
function useMouseLook() {
  const [pitch, setPitch] = useState(0.3);
  const { rotation, updatePlayer } = usePlayerContext();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Horizontal mouse movement rotates player
      const deltaYaw = -e.movementX * SENSITIVITY;
      updatePlayer({ rotation: rotation + deltaYaw });

      // Vertical mouse movement changes camera pitch
      const deltaPitch = e.movementY * SENSITIVITY;
      setPitch((p) => Math.max(MIN_PITCH, Math.min(MAX_PITCH, p + deltaPitch)));
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [rotation]);

  return pitch;
}
```

---

## Camera System

**Location**: `components/camera/camera-controls.tsx`

The game supports three camera modes. Press **1**, **2**, or **3** to switch directly, or **V** to cycle through them.

### Camera Controls

| Key   | Action                        |
| ----- | ----------------------------- |
| **1** | Switch to Third-Person mode   |
| **2** | Switch to Isometric mode      |
| **3** | Switch to First-Person mode   |
| **V** | Cycle through modes (1→2→3→1) |

### Camera Modes Overview

| Mode | Name         | Description                                          |
| ---- | ------------ | ---------------------------------------------------- |
| 1    | Third-Person | Camera behind and above player, follows rotation     |
| 2    | Isometric    | Fixed 45° top-down view, classic strategy game style |
| 3    | First-Person | FPS-style camera at eye level, player model hidden   |

### Mode 1: Third-Person (Default)

Camera positioned behind the player using spherical coordinates.

**Configuration** (`cameraSettings.thirdPerson`):

```typescript
{
  offsetBehind: 5,           // Distance behind player
  offsetUp: 2,               // Height above player
  minHeightAboveTerrain: 1.5, // Prevents camera clipping into terrain
  lookAtOffsetY: 1,          // Look at player chest, not feet
  initialPitch: 0.3,         // Starting vertical angle
}
```

**Behavior**:

- Mouse horizontal movement rotates player
- Mouse vertical movement adjusts camera pitch
- Camera stays above terrain surface
- Player model fully visible

### Mode 2: Isometric

Fixed-angle overhead camera for strategy-game feel.

**Configuration** (`cameraSettings.isometric`):

```typescript
{
  distance: 15,              // Distance from player
  angle: Math.PI / 4,        // 45° from horizontal
  rotationOffset: Math.PI / 4, // 45° rotation for classic isometric
  height: 12,                // Fixed height above player
  followRotation: false,     // Set true to rotate with player
}
```

**Behavior**:

- Camera maintains fixed angle relative to world (not player)
- Good for overview of surrounding terrain
- Player rotation doesn't affect camera angle (unless `followRotation: true`)
- Ideal for tactical/strategic gameplay

### Mode 3: First-Person (FPS)

Camera placed at player's eye level.

**Configuration** (`cameraSettings.firstPerson`):

```typescript
{
  eyeHeight: 1.6,            // Camera height from player base
  lookAtDistance: 10,        // Distance to look-at point
  minPitch: -1.2,            // Look up limit (radians)
  maxPitch: 1.2,             // Look down limit (radians)
}
```

**Behavior**:

- Camera at eye level inside player position
- Player model automatically hidden
- Extended pitch range for looking up/down
- Full immersive first-person experience

### Camera Implementation

```typescript
function CameraControls({ playerRef, angleRef, pitchRef }) {
  const cameraMode = useCameraStore((state) => state.mode);

  useFrame(() => {
    switch (cameraMode) {
      case 1:
        updateThirdPerson(camera, playerPos, yaw, pitchRef, getHeightAt);
        break;
      case 2:
        updateIsometric(camera, playerPos, yaw, getHeightAt);
        break;
      case 3:
        updateFirstPerson(camera, playerPos, yaw, pitchRef);
        break;
    }
  });
}
```

### Camera Store

**Location**: `store/camera-store.ts`

```typescript
interface CameraState {
  mode: CameraMode; // 1, 2, or 3
  setMode: (mode: CameraMode) => void;
  cycleMode: () => void; // Cycles 1→2→3→1
}
```

---

## Objects System

### Procedural Object Generation

**Location**: `terrain/generation/object-generator.ts`

Objects (trees, rocks, bushes, grass) are procedurally placed based on terrain and biome.

**Object Types**:

```typescript
type SectorObjectType = "tree" | "rock" | "bush" | "grass";

interface ISectorObject {
  type: SectorObjectType;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}
```

### Generation Algorithm

```typescript
function generateSectorObjects(
  sectorX: number,
  sectorZ: number,
  heightmap: Float32Array,
  biomeMap: Uint8Array,
): ISectorObject[] {
  const objects: ISectorObject[] = [];
  const rng = createRNG(`${sectorX}-${sectorZ}`); // Seeded RNG

  // Grid-based placement
  const cellSize = sectorSize / objectGridDivisions;

  for (let cx = 0; cx < objectGridDivisions; cx++) {
    for (let cz = 0; cz < objectGridDivisions; cz++) {
      // Noise-based spawn check
      const worldX = sectorX * sectorSize + cx * cellSize;
      const worldZ = sectorZ * sectorSize + cz * cellSize;
      const spawnNoise = objectNoise2D(worldX * 0.1, worldZ * 0.1);

      if (spawnNoise < SPAWN_THRESHOLD) continue;

      // Random position within cell
      const localX = cx * cellSize + rng() * cellSize;
      const localZ = cz * cellSize + rng() * cellSize;

      // Get height and biome at position
      const height = sampleHeightmap(heightmap, localX, localZ);
      const biome = sampleBiomeMap(biomeMap, localX, localZ);

      // Skip if underwater
      if (height < WATER_LEVEL) continue;

      // Select object type based on biome
      const type = selectObjectType(biome, rng);
      if (!type) continue;

      objects.push({
        type,
        x: localX,
        y: height,
        z: localZ,
        scale: 0.8 + rng() * 0.4, // 80% to 120%
        rotation: rng() * Math.PI * 2,
      });
    }
  }

  return objects;
}
```

### Biome-Based Density

```typescript
const BIOME_DENSITIES: Record<BiomeType, Record<SectorObjectType, number>> = {
  forest: { tree: 1.0, rock: 0.1, bush: 0.7, grass: 0.8 },
  plains: { tree: 0.2, rock: 0.15, bush: 0.4, grass: 1.0 },
  desert: { tree: 0.02, rock: 0.4, bush: 0.05, grass: 0.05 },
  savanna: { tree: 0.15, rock: 0.2, bush: 0.3, grass: 0.6 },
  hills: { tree: 0.4, rock: 0.5, bush: 0.3, grass: 0.5 },
  mountains: { tree: 0.1, rock: 0.8, bush: 0.05, grass: 0.1 },
  beach: { tree: 0.0, rock: 0.3, bush: 0.1, grass: 0.2 },
  tundra: { tree: 0.05, rock: 0.6, bush: 0.1, grass: 0.2 },
  water: { tree: 0, rock: 0, bush: 0, grass: 0 },
};
```

### Object Rendering

**Location**: `components/objects/sector-objects.tsx`

**Tree Mesh**:

```typescript
function TreeMesh({ position, scale, rotation }) {
  return (
    <group position={position} scale={scale} rotation-y={rotation}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>

      {/* Lower foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>

      {/* Upper foliage */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <coneGeometry args={[0.7, 1.5, 8]} />
        <meshStandardMaterial color="#3d7a37" roughness={0.8} />
      </mesh>
    </group>
  );
}
```

**Rock Mesh**:

```typescript
function RockMesh({ position, scale, rotation }) {
  return (
    <mesh position={position} scale={[scale, scale * 0.7, scale]} rotation-y={rotation} castShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#6b6b6b" roughness={0.9} />
    </mesh>
  );
}
```

**Bush Mesh**:

```typescript
function BushMesh({ position, scale, rotation }) {
  return (
    <group position={position} scale={scale} rotation-y={rotation}>
      <mesh castShadow><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial color="#3a5a30" /></mesh>
      <mesh position={[0.2, 0.1, 0.1]} castShadow><sphereGeometry args={[0.25, 8, 8]} /><meshStandardMaterial color="#4a6a40" /></mesh>
      <mesh position={[-0.15, 0.05, 0.15]} castShadow><sphereGeometry args={[0.28, 8, 8]} /><meshStandardMaterial color="#3a5a30" /></mesh>
    </group>
  );
}
```

**Grass Mesh**:

```typescript
function GrassMesh({ position, scale, rotation }) {
  return (
    <group position={position} scale={scale * 0.5} rotation-y={rotation}>
      <mesh rotation-z={0.2}><boxGeometry args={[0.02, 0.4, 0.02]} /><meshStandardMaterial color="#5a8a50" /></mesh>
      <mesh rotation-z={-0.15}><boxGeometry args={[0.02, 0.35, 0.02]} /><meshStandardMaterial color="#4a7a40" /></mesh>
      <mesh rotation-x={0.1}><boxGeometry args={[0.02, 0.38, 0.02]} /><meshStandardMaterial color="#5a8a50" /></mesh>
    </group>
  );
}
```

### Hover Indicator

**Location**: `components/terrain/hover-indicator.tsx`

A terrain-conforming hover indicator that shows where the player is pointing.

**Features**:

- Samples terrain height at multiple points
- Creates a subdivided mesh that follows terrain contours
- Floats slightly above terrain to prevent z-fighting
- Configurable size, resolution, color, and opacity

**Implementation**:

```typescript
function HoverIndicator({ position, size, resolution }) {
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);

  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    // Sample terrain at each vertex
    for (let i = 0; i < vertices.length; i++) {
      const worldX = localX + centerX;
      const worldZ = localZ + centerZ;
      vertices[i].y = getHeightAt(worldX, worldZ) + heightOffset;
    }

    return geo;
  }, [position]);
}
```

### Block System

**Location**: `components/objects/block.tsx`

Interactive blocks that can be placed on terrain for building mechanics.

```typescript
function Block({ position, onClick }) {
  const [hovered, setHovered] = useState(false);

  const [ref] = useBox(() => ({
    type: 'Static',
    position: [position.x, position.y, position.z],
    args: [1, 1, 1]
  }));

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // Get face normal to determine placement direction
    const normal = e.face?.normal;
    if (normal && onClick) {
      onClick({
        x: position.x + normal.x,
        y: position.y + normal.y,
        z: position.z + normal.z
      });
    }
  };

  return (
    <mesh
      ref={ref}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? '#8888ff' : '#888888'} />
    </mesh>
  );
}
```

---

## Dev Panel

A static developer panel displayed in the top-right corner, similar to the Leva debug panel. Shows real-time performance metrics and game state information.

### Architecture

The dev panel uses a multi-component architecture:

| Component              | Location                              | Purpose                                   |
| ---------------------- | ------------------------------------- | ----------------------------------------- |
| `StatsCollector`       | `components/ui/performance-stats.tsx` | Runs inside Canvas, collects WebGL stats  |
| `DevPanel`             | `components/ui/dev-panel.tsx`         | Renders outside Canvas, displays UI       |
| `OrientationIndicator` | `components/ui/dev-panel.tsx`         | CSS-based 3D axes that rotate with player |

```
┌─────────────────────────────────────────────┐
│  App                                        │
│  ┌─────────────────────────────────────┐   │
│  │  DevPanel (HTML)     ← reads store  │   │
│  │  ┌───────────────────────────┐     │   │
│  │  │ OrientationIndicator      │     │   │
│  │  │ (CSS 3D transforms)       │     │   │
│  │  └───────────────────────────┘     │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Canvas                             │   │
│  │  ┌─────────────────────────────┐   │   │
│  │  │ StatsCollector → updates    │   │   │
│  │  │                   store     │   │   │
│  │  └─────────────────────────────┘   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Panel Sections

**Performance**
| Metric | Description |
|--------|-------------|
| FPS | Frames per second (color-coded: green ≥55, yellow ≥30, red <30) |
| Frame | Average frame time in milliseconds |
| Memory | JavaScript heap memory usage (Chrome only) |
| Draw Calls | Number of WebGL draw calls per frame |
| Triangles | Total triangles rendered |

**World**
| Metric | Description |
|--------|-------------|
| Sectors | Currently loaded terrain sectors |
| Geometries | Number of geometries in memory |

**Player**
| Metric | Description |
|--------|-------------|
| Orientation | 3D mini-axes indicator that rotates with player facing direction |
| X | Player X coordinate (1 decimal place) |
| Y | Player Y coordinate (1 decimal place) |
| Z | Player Z coordinate (1 decimal place) |
| Rotation | Player facing direction in degrees (0-360°) |
| Speed | Movement speed in units/second (shows "DEV" indicator when dev speed enabled) |
| Camera | Current camera mode name |

### Configuration (`statsSettings`)

```typescript
export const statsSettings = {
  enabled: true, // Show dev panel
  showDetailed: true, // Show detailed metrics
  toggleKey: "KeyF", // Toggle visibility key
  position: "top-right", // Panel position
};
```

### Stats Store

**Location**: `store/stats-store.ts`

```typescript
interface StatsState {
  visible: boolean;
  showDetailed: boolean;
  stats: {
    fps: number;
    frameTime: number;
    memory: number | null;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  toggleVisible: () => void;
  updateStats: (stats: Partial<PerformanceStats>) => void;
}
```

### Key Binding

| Key | Action                      |
| --- | --------------------------- |
| F   | Toggle dev panel visibility |

---

## Performance Optimizations

### 1. Sector-Based Culling

Only sectors near the player are loaded, drastically reducing render load.

**Load/Unload Configuration**:

```typescript
loadDistance: 2; // 5x5 = 25 sectors max loaded
unloadDistance: 4; // Beyond this distance, sectors unload
```

**Memory Impact**:

- Each sector: ~64KB heightmap + objects
- Max loaded: 25 sectors = ~1.6MB terrain data
- Unloading prevents unbounded memory growth

### 2. Heightmap Resolution Balance

```typescript
heightmapResolution: 64; // 64x64 = 4,096 vertices per sector
```

**Trade-off Analysis**:
| Resolution | Vertices/Sector | Visual Quality | Performance |
|------------|-----------------|----------------|-------------|
| 32 | 1,024 | Low | Excellent |
| 64 | 4,096 | Good | Good |
| 128 | 16,384 | High | Moderate |
| 256 | 65,536 | Very High | Poor |

64x64 provides good visual quality while maintaining 60fps on most hardware.

### 3. Geometry Memoization

**React Memoization**:

```typescript
const geometry = useMemo(() => {
  const geo = new PlaneGeometry(size, size, res - 1, res - 1);
  // ... vertex manipulation
  return geo;
}, [sector]); // Only recreate when sector changes
```

**Component Memoization**:

```typescript
const SectorObjects = memo(({ sector }: Props) => {
  // ... render objects
});
```

### 4. Three.js Configuration

**Canvas Settings** (`app.tsx`):

```typescript
<Canvas
  gl={{
    antialias: true,
    logarithmicDepthBuffer: true, // Fixes z-fighting at distance
  }}
  camera={{
    fov: 75,
    near: 0.1,
    far: 10000
  }}
  shadows
>
```

### 5. Shadow Optimization

**Shadow Map Configuration** (`lights/sun.tsx`):

```typescript
<directionalLight
  castShadow
  shadow-mapSize-width={2048}
  shadow-mapSize-height={2048}
  shadow-camera-near={0.5}
  shadow-camera-far={500}
  shadow-camera-left={-150}
  shadow-camera-right={150}
  shadow-camera-top={150}
  shadow-camera-bottom={-150}
/>
```

**Shadow Cascades**: Single shadow map covers 300x300 unit area, sufficient for visible terrain.

### 6. Object Rendering Optimization

**Conditional Rendering**:

```typescript
if (sector.objects.length === 0) return null;
```

**Future Optimizations** (not yet implemented):

- **Instanced Meshes**: Render many identical objects in one draw call
- **LOD (Level of Detail)**: Simpler meshes at distance
- **Frustum Culling**: Skip objects outside camera view

### 7. IndexedDB Caching

Terrain regeneration is CPU-intensive. Caching prevents redundant computation.

**Cache Flow**:

```
Load Sector Request
    ↓
Check IndexedDB → Found? → Load from cache
    ↓ (Not found)
Generate terrain (expensive)
    ↓
Save to IndexedDB
    ↓
Return sector data
```

**Benefits**:

- First visit: Full generation cost
- Subsequent visits: Near-instant load
- Persists across sessions

### 8. State Management Efficiency

**Zustand Subscriptions**:

```typescript
// Only subscribes to specific slice
const height = useTerrainStore((state) => state.getHeightAtPosition);

// Avoids re-render on unrelated state changes
const sectors = useTerrainStore((state) => state.loadedSectors);
```

**useCallback for Handlers**:

```typescript
const handleClick = useCallback(
  (pos) => {
    // ... handler logic
  },
  [dependencies],
);
```

### 9. Frame-Independent Movement

Movement scales with delta time for consistent speed across frame rates:

```typescript
useFrame((_, delta) => {
  const movement = speed * delta * 60; // Normalized to 60fps
});
```

---

## Configuration Reference

### Main Settings (`constants/settings.ts`)

```typescript
// Terrain Settings
sectorSize: 100,              // World units per sector
heightmapResolution: 64,      // Grid points per sector edge
loadDistance: 2,              // Load sectors within N sectors
unloadDistance: 4,            // Unload beyond N sectors

// Terrain Generation
terrainAmplitude: 15,         // Base height variation
mountainAmplitude: 50,        // Mountain height
terrainFrequency: 0.012,      // Base noise frequency
terrainOctaves: 4,            // Noise layers
terrainPersistence: 0.5,      // Amplitude decay per octave

// Objects
objectDensity: 0.5,           // Base spawn density

// Water
waterLevel: -1,               // Sea level height

// Fog
fogSettings: {
  enabled: true,
  near: 50,                   // Fog start distance
  far: 200,                   // Full fog distance
}

// Camera
cameraSettings: {
  defaultMode: 1,             // Starting camera mode
  toggleKey: "KeyV",          // Key to cycle modes
  thirdPerson: { ... },       // Mode 1 settings
  isometric: { ... },         // Mode 2 settings
  firstPerson: { ... },       // Mode 3 settings
}

// Player
playerSettings: {
  baseSpeed: 0.022,           // Movement speed
  runMultiplier: 3,           // Sprint multiplier
  devSpeedMultiplier: 20,     // Dev mode multiplier
  rotationSpeed: 0.03,        // Turn speed (radians/frame)
  mouseSensitivity: 0.002,    // Mouse look sensitivity
}

// Day/Night
dayNightSettings: {
  initialTimeOfDay: 0.35,     // Start time
  defaultCycleSpeed: 1,       // 1 = 24 minutes per day
  dayLengthMinutes: 24,       // Real minutes for full cycle
}

// Hover Indicator
hoverIndicatorSettings: {
  enabled: true,
  size: 1,                    // Size in world units
  resolution: 8,              // Grid subdivisions
  heightOffset: 0.05,         // Float above terrain
  color: "#ff0000",
  opacity: 0.4,
}

// Debug
debugSettings: {
  showAxisHelper: false,
  showPhysicsDebug: false,
  showMiniMap: true,
}
```

### Biome Thresholds

```typescript
export const BIOME_THRESHOLDS = {
  waterLevel: -2,
  beachLevel: 0,
  hillLevel: 8,
  mountainLevel: 20,

  moistureLow: 0.2,
  moistureMid: 0.5,
  moistureHigh: 0.7,

  temperatureHot: 0.6,
};
```

### Debug Controls (Leva)

Available at runtime via the Leva panel:

| Control     | Range     | Default | Effect              |
| ----------- | --------- | ------- | ------------------- |
| Gravity X   | -20 to 20 | 0       | Horizontal gravity  |
| Gravity Y   | -20 to 20 | -9.8    | Vertical gravity    |
| Gravity Z   | -20 to 20 | 0       | Horizontal gravity  |
| Time of Day | 0 to 1    | 0.25    | Manual time control |
| Cycle Speed | 0 to 10   | 1       | Day/night speed     |
| Paused      | boolean   | false   | Freeze time         |

---

## Key File Reference

| Component         | File Path                                     |
| ----------------- | --------------------------------------------- |
| App Entry         | `src/main.tsx`                                |
| Scene Setup       | `src/components/scene/scene.tsx`              |
| Terrain Generator | `src/terrain/generation/terrain-generator.ts` |
| Sector Manager    | `src/terrain/hooks/use-sector-manager.ts`     |
| Terrain Store     | `src/store/terrain-store.ts`                  |
| Player Component  | `src/player/player.tsx`                       |
| Movement Hook     | `src/player/hooks/use-player-movement.ts`     |
| Keyboard Input    | `src/player/hooks/use-keyboard-input.ts`      |
| Mouse Look        | `src/player/hooks/use-mouse-look.ts`          |
| Animation Hook    | `src/player/hooks/use-player-animation.ts`    |
| Camera Controls   | `src/components/camera/camera-controls.tsx`   |
| Camera Store      | `src/store/camera-store.ts`                   |
| Stats Store       | `src/store/stats-store.ts`                    |
| Stats Collector   | `src/components/ui/performance-stats.tsx`     |
| Dev Panel         | `src/components/ui/dev-panel.tsx`             |
| Tile Renderer     | `src/components/terrain/tile.tsx`             |
| Hover Indicator   | `src/components/terrain/hover-indicator.tsx`  |
| Object Generator  | `src/terrain/generation/object-generator.ts`  |
| Sector Objects    | `src/components/objects/sector-objects.tsx`   |
| Day/Night Store   | `src/store/day-night-store.ts`                |
| Dev Store         | `src/store/dev-store.ts`                      |
| Sun Light         | `src/components/lights/sun.tsx`               |
| Sky Component     | `src/components/sky/sky.tsx`                  |
| Fog               | `src/components/atmosphere/fog.tsx`           |
| IndexedDB         | `src/terrain/db/terrain-db.ts`                |
| Settings          | `src/constants/settings.ts`                   |
| Types             | `src/types/*.ts`                              |
