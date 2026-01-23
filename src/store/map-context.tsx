import { createContext, useContext, useReducer, ReactNode } from "react";
import { sectorSize } from "../constants/settings";

interface MapState {
  [key: string]: {
    neighbours?: string[];
  };
}

const initialState: MapState = {
  "0x0": {
    neighbours: [
      `${sectorSize}x${sectorSize}`,
      `0x${sectorSize}`,
      `-${sectorSize}x${sectorSize}`,
      `${sectorSize}x0`,
      `-${sectorSize}x0`,
      `${sectorSize}x-${sectorSize}`,
      `0x-${sectorSize}`,
      `-${sectorSize}x-${sectorSize}`,
    ],
  },
};

const ADD_SECTOR = "ADD_SECTOR";

interface AddSectorAction {
  type: typeof ADD_SECTOR;
  payload: string;
}

type MapAction = AddSectorAction;

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case ADD_SECTOR:
      return {
        ...state,
        [action.payload]: {},
      };
    default:
      return state;
  }
};

interface MapContextValue {
  map: MapState;
}

const MapContext = createContext<MapContextValue | null>(null);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [state] = useReducer(mapReducer, initialState);

  return (
    <MapContext.Provider value={{ map: state }}>{children}</MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === null) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};
