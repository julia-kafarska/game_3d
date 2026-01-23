import { create } from "zustand";
import { statsSettings } from "../constants/settings";

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memory: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

interface StatsState {
  visible: boolean;
  showDetailed: boolean;
  stats: PerformanceStats;
  toggleVisible: () => void;
  toggleDetailed: () => void;
  setVisible: (visible: boolean) => void;
  updateStats: (stats: Partial<PerformanceStats>) => void;
}

const initialStats: PerformanceStats = {
  fps: 0,
  frameTime: 0,
  memory: null,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
};

export const useStatsStore = create<StatsState>((set) => ({
  visible: statsSettings.enabled,
  showDetailed: statsSettings.showDetailed,
  stats: initialStats,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),

  toggleDetailed: () => set((state) => ({ showDetailed: !state.showDetailed })),

  setVisible: (visible: boolean) => set({ visible }),

  updateStats: (newStats) =>
    set((state) => ({
      stats: { ...state.stats, ...newStats },
    })),
}));
