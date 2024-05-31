import { IPosition } from "./Position.ts";

export interface IObject {
  position: {
    x: number;
    y: number;
    z: number;
  };
  size: {
    w: number;
    h: number;
    d: number;
  };
}

export interface IObjects {
  position: IPosition;
  onLeftClick: (params: IPosition) => void;
  onRightClick: (params: IPosition) => void;
}
