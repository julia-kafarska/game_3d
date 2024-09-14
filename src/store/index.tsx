import { createContext, useContext, useReducer, ReactNode } from "react";

// Define the initial state
const initialState = {
  map: {
    "0x0": {
      neighbours: [
        "0x10",
        "-10x10",
        "10x0",
        "0x-10",
        "10x-10",
        "-10x-10",
        "-10x0",
      ],
    },
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
        map: {
          ...state.map,
          [action.payload]: {}, // Add the new sector to the map
        },
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

  // Function to add a new sector
  const addSector = (coord: string) => {
    dispatch({ type: ADD_SECTOR, payload: coord });
  };
  // Function to add a new sector
  const getSector = (coord: string) => state.map[coord];

  return (
    <MapContext.Provider value={{ map: state.map, addSector, getSector }}>
      {children}
    </MapContext.Provider>
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
