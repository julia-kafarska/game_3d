import { IPosition } from "./position.ts";

export interface IObject {
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface IObjects {
  position: IPosition;
  onLeftClick: (params: IPosition) => void;
  onRightClick: (params: IPosition) => void;
}
