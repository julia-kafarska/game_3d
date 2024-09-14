import { IPosition } from "./Position.ts";
import { IBoxSize } from "./Size.ts";

export interface ILeftClickParams extends IPosition {
  action: string;
  position: IPosition;
}

export interface ITerrain {
  onLeftClick: (params: ILeftClickParams) => void;
  position?: { x: number; y: number; z: number };
}

export interface ITerrainBlock {
  position: IPosition;
  size?: IBoxSize;
  onLeftClick: (params: {
    x: number;
    y: number;
    action: string;
    z: number;
  }) => void;
}
