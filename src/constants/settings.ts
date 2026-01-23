// Sector settings
export const sectorSize = 100; // World units per sector
export const heightmapResolution = 64; // Points per sector edge (higher = smoother terrain)
export const loadDistance = 2; // Load sectors within N sectors of player
export const unloadDistance = 4; // Unload sectors beyond N sectors

// Terrain generation settings
export const terrainSeed = "world-seed-12345"; // Seed for reproducible terrain
export const terrainAmplitude = 15; // Max height variation for base terrain
export const terrainFrequency = 0.012; // Base noise frequency
export const terrainOctaves = 4; // Number of noise layers
export const terrainPersistence = 0.5; // Amplitude decay per octave

// Mountain generation settings
export const mountainAmplitude = 50; // Additional height for mountains
export const mountainFrequency = 0.005; // Lower frequency for large mountain ranges
export const ridgeSharpness = 2.2; // How sharp the mountain ridges are (1-3)
export const continentalFrequency = 0.002; // Very low frequency for continents/regions
export const continentalInfluence = 0.75; // How much continental noise affects terrain (0-1)
export const warpStrength = 40; // Domain warping strength for natural shapes

// Object generation settings
export const objectDensity = 0.5; // Base objects per unit area (0-1)

// Biome object density settings (0-1 multiplier)
export const biomeDensity = {
  water: {
    tree: 0,
    rock: 0,
    bush: 0,
    grass: 0,
  },
  beach: {
    tree: 0.05,
    rock: 0.2,
    bush: 0.1,
    grass: 0.3,
  },
  desert: {
    tree: 0.02,
    rock: 0.4,
    bush: 0.05,
    grass: 0.05,
  },
  savanna: {
    tree: 0.2,
    rock: 0.15,
    bush: 0.3,
    grass: 0.7,
  },
  plains: {
    tree: 0.3,
    rock: 0.1,
    bush: 0.5,
    grass: 1.0,
  },
  forest: {
    tree: 1.0,
    rock: 0.1,
    bush: 0.7,
    grass: 0.8,
  },
  hills: {
    tree: 0.4,
    rock: 0.5,
    bush: 0.3,
    grass: 0.5,
  },
  mountains: {
    tree: 0.1,
    rock: 0.8,
    bush: 0.05,
    grass: 0.1,
  },
  tundra: {
    tree: 0.02,
    rock: 0.6,
    bush: 0.1,
    grass: 0.2,
  },
};

// Water settings
export const waterLevel = -1; // Sea level height

// ============================================
// FOG SETTINGS
// ============================================
export const fogSettings = {
  enabled: true,
  near: 50, // Distance where fog starts (units)
  far: 200, // Distance where fog is fully opaque (units)
  // Colors for different times of day (RGB 0-1)
  colors: {
    night: { r: 0.05, g: 0.08, b: 0.15 },
    twilight: { r: 0.6, g: 0.4, b: 0.4 },
    sunrise: { r: 0.87, g: 0.81, b: 0.87 },
    day: { r: 0.87, g: 0.81, b: 0.87 },
  },
};

// ============================================
// SKY SETTINGS
// ============================================
export const skySettings = {
  distance: 450000, // Sky dome distance
  // Atmospheric scattering defaults
  turbidity: 8, // Haziness (higher = more haze)
  turbidityTwilight: 10, // Extra haze at sunrise/sunset
  rayleigh: 2, // Blue sky scattering
  rayleighNight: 0.5, // Reduced blue at night
  mieCoefficient: 0.005, // Sun glow during day
  mieCoefficientNight: 0.001, // Reduced glow at night
  mieDirectionalG: 0.8, // Sun glow directionality
};

// ============================================
// STARS SETTINGS
// ============================================
export const starsSettings = {
  enabled: true,
  count: 5000, // Number of stars
  radius: 300, // Sphere radius for star placement
  depth: 100, // Depth variation
  factor: 4, // Size factor
  saturation: 0, // Color saturation (0 = white)
  speed: 0.5, // Twinkle speed
};

// ============================================
// SUN & LIGHTING SETTINGS
// ============================================
export const sunSettings = {
  orbitRadius: 200, // Distance from world center
  visualSize: 15, // Sun sphere radius for visual
  color: "#fff5e0", // Sun mesh color
  // Shadow map configuration
  shadow: {
    mapSize: 2048, // Shadow map resolution (power of 2)
    cameraFar: 500, // Shadow camera far plane
    cameraBounds: 150, // Shadow camera left/right/top/bottom
    bias: -0.0001, // Shadow bias to reduce artifacts
  },
};

export const moonSettings = {
  orbitRadius: 200, // Same as sun, opposite side
  visualSize: 10, // Moon sphere radius
  color: "#e8e8f0", // Moon mesh color
  intensity: 0.3, // Max moon light intensity (relative to sun)
};

export const ambientLightSettings = {
  intensityDay: 0.7, // Ambient intensity during day
  intensityNight: 0.1, // Ambient intensity at night
  // Colors for different times
  colors: {
    night: { r: 0.4, g: 0.5, b: 0.7 },
    twilight: { r: 0.6, g: 0.5, b: 0.6 },
    day: { r: 1, g: 1, b: 1 },
  },
};

// ============================================
// DAY/NIGHT CYCLE SETTINGS
// ============================================
export const dayNightSettings = {
  initialTimeOfDay: 0.35, // Starting time (0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset)
  defaultCycleSpeed: 1, // 1 = full day in 24 real minutes
  dayLengthMinutes: 24, // Real minutes for one full day at speed 1
  // Thresholds for time-of-day calculations
  sunriseStart: 0.2, // When sunrise begins
  sunriseEnd: 0.3, // When sunrise ends (full day)
  sunsetStart: 0.7, // When sunset begins
  sunsetEnd: 0.8, // When sunset ends (full night)
};

// ============================================
// CAMERA SETTINGS
// ============================================
export type CameraMode = 1 | 2 | 3; // 1 = Third-person, 2 = Isometric, 3 = First-person

export const cameraSettings = {
  fov: 75, // Field of view (degrees)
  near: 0.1, // Near clipping plane
  far: 10000, // Far clipping plane
  defaultMode: 1 as CameraMode, // Starting camera mode
  toggleKey: "KeyV", // Key to cycle camera modes

  // Mode 1: Third-person (behind player)
  thirdPerson: {
    offsetBehind: 5, // Distance behind player
    offsetUp: 2, // Height above player
    minHeightAboveTerrain: 1.5, // Minimum camera height above ground
    lookAtOffsetY: 1, // Look at point offset above player feet
    initialPitch: 0.3, // Starting camera pitch (radians)
  },

  // Mode 2: Isometric (top-down angled)
  isometric: {
    distance: 15, // Distance from player
    angle: Math.PI / 4, // 45 degrees from horizontal
    rotationOffset: Math.PI / 4, // Rotate 45 degrees for classic isometric look
    height: 12, // Fixed height above player
    followRotation: false, // Whether camera rotates with player
  },

  // Mode 3: First-person (FPS)
  firstPerson: {
    eyeHeight: 1.6, // Camera height from player base
    lookAtDistance: 10, // Distance to look-at point
    minPitch: -1.2, // Look up limit (radians)
    maxPitch: 1.2, // Look down limit (radians)
  },
};

// ============================================
// PLAYER SETTINGS
// ============================================
export const playerSettings = {
  // Movement speeds
  baseSpeed: 0.022, // Base movement speed (units per frame)
  runMultiplier: 3, // Speed multiplier when running
  devSpeedMultiplier: 20, // Speed multiplier in dev mode
  rotationSpeed: 0.03, // Turning speed (radians per frame)
  // Mouse look
  mouseSensitivity: 0.002, // Mouse look sensitivity
  pitchMin: -0.5, // Minimum pitch (looking up)
  pitchMax: 0.8, // Maximum pitch (looking down)
  // Physics
  height: 1.8, // Player collision height
  width: 0.5, // Player collision width
  mass: 1, // Physics mass
};

// ============================================
// PHYSICS SETTINGS
// ============================================
export const physicsSettings = {
  gravity: {
    x: 0,
    y: -9.81, // Earth-like gravity
    z: 0,
  },
  // Physics simulation settings
  iterations: 10, // Solver iterations
  tolerance: 0.001, // Solver tolerance
};

// ============================================
// RENDER SETTINGS
// ============================================
export const renderSettings = {
  antialias: true,
  logarithmicDepthBuffer: true, // Better depth precision at distance
  shadowsEnabled: true,
  pixelRatio: 1, // Device pixel ratio (1 = native, lower = better performance)
};

// ============================================
// HOVER INDICATOR SETTINGS
// ============================================
export const hoverIndicatorSettings = {
  enabled: true,
  size: 1, // Size of the hover indicator (world units)
  resolution: 8, // Grid resolution for terrain conforming (higher = smoother)
  heightOffset: 0.05, // Height above terrain surface
  color: "#ff0000", // Indicator color
  opacity: 0.4, // Transparency (0-1)
};

// ============================================
// DEBUG SETTINGS
// ============================================
export const debugSettings = {
  showAxisHelper: false,
  showPhysicsDebug: false,
  showMiniMap: true,
};

// ============================================
// PERFORMANCE STATS SETTINGS
// ============================================
export const statsSettings = {
  enabled: true, // Show performance stats panel
  showDetailed: true, // Show detailed stats (draw calls, triangles, etc.)
  toggleKey: "KeyF", // Key to toggle stats panel
  position: "top-right" as
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right",
};
