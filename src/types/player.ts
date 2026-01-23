import { IPosition } from "./position";

export interface IPlayer {
  position: IPosition;
  rotation: number;
}

export interface IUpdatePlayerPayload {
  position: IPosition;
  rotation?: number;
}
