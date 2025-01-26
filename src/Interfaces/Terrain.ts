import { IPosition } from "./position.ts";
import { IBoxSize } from "./size.ts";

export interface ILeftClickParams extends IPosition {
  position: IPosition;
  action: string;
}

export interface ITerrain {
  onLeftClick: (params: ILeftClickParams) => void;
  setHover: any;
  hovered: any;
}

export interface ITerrainBlock {
  position: IPosition;
  size?: IBoxSize;
  onLeftClick: (params: {
    x: number;
    y: number;
    z: number;
    action: string;
  }) => void;
}
