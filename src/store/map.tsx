import { createContext, useContext, useReducer, ReactNode } from "react";
import { sectorSize } from "../const/settings.ts";

// Define the initial state
const initialState = {
  "0x0": {
    // heres the problem !!!!!!
    neighbours: [
      `${sectorSize}x${sectorSize}`, // Top-right
      `0x${sectorSize}`, // Above
      `-${sectorSize}x${sectorSize}`, // Top-left
      `${sectorSize}x0`, // Right
      `-${sectorSize}x0`, // Left
      `${sectorSize}x-${sectorSize}`, // Bottom-right
      `0x-${sectorSize}`, // Below
      `-${sectorSize}x-${sectorSize}`, // Bottom-left
    ],
  },
};

// Define action types
const ADD_SECTOR = "ADD_SECTOR";

// Reducer function to manage the map state
const mapReducer = (state: any, action: any) => {
  switch (action.type) {
    case ADD_SECTOR:
      return {
        ...state,
        [action.payload]: {}, // Add the new sector to the map
      };
    default:
      return state;
  }
};

// Create the MapContext
const MapContext = createContext<any>(null);

// Provider component
export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  return (
    <MapContext.Provider value={{ map: state }}>{children}</MapContext.Provider>
  );
};

// Hook to use the MapContext in components
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === null) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};
