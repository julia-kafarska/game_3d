import { create } from "zustand";
import { CameraMode, cameraSettings } from "../constants/settings";

interface CameraState {
  mode: CameraMode;
  setMode: (mode: CameraMode) => void;
  cycleMode: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  mode: cameraSettings.defaultMode,

  setMode: (mode: CameraMode) => set({ mode }),

  cycleMode: () =>
    set((state) => ({
      mode: ((state.mode % 3) + 1) as CameraMode,
    })),
}));
