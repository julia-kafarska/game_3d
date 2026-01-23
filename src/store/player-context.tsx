import { createContext, useContext, useReducer, ReactNode } from "react";
import { IPlayer, IUpdatePlayerPayload } from "../types/player";

const initialState: IPlayer = {
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  rotation: 0,
};

const UPDATE_PLAYER = "UPDATE_PLAYER";

interface UpdatePlayerAction {
  type: typeof UPDATE_PLAYER;
  payload: IUpdatePlayerPayload;
}

type PlayerAction = UpdatePlayerAction;

const playerReducer = (state: IPlayer, action: PlayerAction): IPlayer => {
  switch (action.type) {
    case UPDATE_PLAYER: {
      const { position, rotation } = action.payload;
      return {
        ...state,
        position,
        rotation: rotation ?? state.rotation,
      };
    }
    default:
      return state;
  }
};

interface PlayerContextValue {
  player: IPlayer;
  updatePlayer: (payload: IUpdatePlayerPayload) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  const updatePlayer = (updatePlayerPayload: IUpdatePlayerPayload) => {
    dispatch({ type: UPDATE_PLAYER, payload: updatePlayerPayload });
  };

  return (
    <PlayerContext.Provider value={{ player: state, updatePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === null) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
};
