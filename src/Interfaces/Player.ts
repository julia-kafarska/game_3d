import { RefObject } from "react";

export type MutableRef3dObject = RefObject<MutableRef3dObject>;
export type MockPlayerProps = {
  playerRef: MutableRef3dObject;
  cameraRef: MutableRef3dObject;
};
