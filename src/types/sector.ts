export interface ISectorCoord {
  x: number; // Sector X index (world position / sectorSize)
  z: number; // Sector Z index (world position / sectorSize)
}

export type SectorObjectType = "tree" | "rock" | "bush" | "grass";

export interface ISectorObject {
  id: string;
  type: SectorObjectType;
  x: number; // World X position
  y: number; // World Y position (height)
  z: number; // World Z position
  scale: number; // Size multiplier
  rotation: number; // Y-axis rotation
}

export interface ISector {
  key: string; // "0x0", "100x0", etc.
  heightmap: number[]; // Flattened grid of heights (heightmapResolution^2 values)
  biome: string; // "plains", "hills", "mountains"
  objects: ISectorObject[]; // Objects in this sector
  createdAt: number; // Timestamp
}

export interface ILoadedSector extends ISector {
  worldX: number; // World X position (sector coord * sectorSize)
  worldZ: number; // World Z position (sector coord * sectorSize)
}
