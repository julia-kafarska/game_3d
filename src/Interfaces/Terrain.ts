import { IPosition } from "./Position.ts";
import { IBoxSize } from "./Size.ts";

export interface ILeftClickParams extends IPosition {
  action: string;
  position: IPosition;
}

export interface ITerrain {
  onLeftClick: (params: ILeftClickParams) => void;
}
export interface ITerrainBlock {
  position: IPosition;
  size?: IBoxSize;
  onLeftClick: (params: ILeftClickParams) => void;
}
