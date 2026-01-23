import { create } from "zustand";

interface DevState {
  speedMultiplier: number;
  toggleDevSpeed: () => void;
}

export const useDevStore = create<DevState>((set) => ({
  speedMultiplier: 1,
  toggleDevSpeed: () =>
    set((state) => ({
      speedMultiplier: state.speedMultiplier === 1 ? 20 : 1,
    })),
}));
