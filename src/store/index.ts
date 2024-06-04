import { create } from "zustand";

const useMapStore = create((set) => ({
  map: {},
  addSector: (coord: string) =>
    set((state) => ({
      map: {
        ...state.map,
        [coord]: {},
      },
    })),
}));

export default useMapStore;
