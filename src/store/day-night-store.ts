import { create } from "zustand";

interface DayNightState {
  // Time of day: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1 = midnight
  timeOfDay: number;
  // Speed multiplier for day/night cycle (1 = 1 full day per 24 real minutes)
  cycleSpeed: number;
  // Whether the cycle is paused
  isPaused: boolean;

  // Actions
  setTimeOfDay: (time: number) => void;
  setCycleSpeed: (speed: number) => void;
  togglePause: () => void;
  tick: (deltaSeconds: number) => void;

  // Computed values
  getSunPosition: () => { x: number; y: number; z: number };
  getMoonPosition: () => { x: number; y: number; z: number };
  getSunIntensity: () => number;
  getMoonIntensity: () => number;
  getAmbientIntensity: () => number;
  isNight: () => boolean;
}

// Distance from origin for sun/moon orbit
const ORBIT_RADIUS = 200;

export const useDayNightStore = create<DayNightState>((set, get) => ({
  timeOfDay: 0.35, // Start at morning
  cycleSpeed: 1,
  isPaused: false,

  setTimeOfDay: (time: number) => set({ timeOfDay: time % 1 }),

  setCycleSpeed: (speed: number) => set({ cycleSpeed: speed }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  tick: (deltaSeconds: number) => {
    const { isPaused, cycleSpeed, timeOfDay } = get();
    if (isPaused) return;

    // Full cycle in 24 real minutes at speed 1
    // So 1 second = 1/(24*60) = 0.000694 of a day at speed 1
    const dayProgress = (deltaSeconds / (24 * 60)) * cycleSpeed;
    set({ timeOfDay: (timeOfDay + dayProgress) % 1 });
  },

  getSunPosition: () => {
    const { timeOfDay } = get();
    // Sun angle: 0 at midnight (below horizon), 0.5 at noon (highest point)
    // Convert timeOfDay to angle: midnight = -PI/2, noon = PI/2
    const angle = (timeOfDay - 0.25) * Math.PI * 2;

    return {
      x: Math.cos(angle) * ORBIT_RADIUS,
      y: Math.sin(angle) * ORBIT_RADIUS,
      z: 50, // Slight offset for more interesting shadows
    };
  },

  getMoonPosition: () => {
    const { timeOfDay } = get();
    // Moon is opposite to sun
    const angle = (timeOfDay - 0.25 + 0.5) * Math.PI * 2;

    return {
      x: Math.cos(angle) * ORBIT_RADIUS,
      y: Math.sin(angle) * ORBIT_RADIUS,
      z: -50,
    };
  },

  getSunIntensity: () => {
    const { timeOfDay } = get();
    // Sun intensity based on height above horizon
    // Peak at noon (0.5), zero at night
    const sunHeight = Math.sin((timeOfDay - 0.25) * Math.PI * 2);

    if (sunHeight <= 0) return 0;

    // Smooth intensity curve
    return Math.pow(sunHeight, 0.5) * 1.5;
  },

  getMoonIntensity: () => {
    const { timeOfDay } = get();
    // Moon intensity - opposite of sun
    const moonHeight = Math.sin((timeOfDay - 0.25 + 0.5) * Math.PI * 2);

    if (moonHeight <= 0) return 0;

    // Moon is dimmer than sun
    return Math.pow(moonHeight, 0.5) * 0.3;
  },

  getAmbientIntensity: () => {
    const { timeOfDay } = get();
    const sunHeight = Math.sin((timeOfDay - 0.25) * Math.PI * 2);

    // Ambient light: brighter during day, dimmer at night
    if (sunHeight > 0) {
      return 0.3 + sunHeight * 0.4;
    } else {
      // Night time - very dim ambient
      return 0.1;
    }
  },

  isNight: () => {
    const { timeOfDay } = get();
    // Night is roughly 0.75 to 0.25 (sunset to sunrise)
    return timeOfDay < 0.25 || timeOfDay > 0.75;
  },
}));
