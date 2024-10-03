import { createContext, useContext, useReducer, ReactNode } from "react";

const initialState = {
  position: {
    x: 0,
    y: -0.5,
    z: 0,
  },
  rotation: 0,
};

const UPDATE_PLAYER = "UPDATE_PLAYER";

interface IUpdatePlayerPayload {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
}
const mapReducer = (state: any, action: any) => {
  switch (action.type) {
    case UPDATE_PLAYER: {
      const { position } = action.payload;
      return {
        ...state,
        position,
      };
    }
    default:
      return state;
  }
};

const PlayerContext = createContext<any>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  const updatePlayer = (updatePlayerPayload: IUpdatePlayerPayload) => {
    dispatch({ type: UPDATE_PLAYER, payload: updatePlayerPayload });
  };

  return (
    <PlayerContext.Provider value={{ player: state, updatePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

// Hook to use the PlayerContext in components
export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === null) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
};
