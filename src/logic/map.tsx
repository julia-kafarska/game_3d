// Define the map size and initial point

const sectorSize = 100; // Each map is 100x100 in size
const mapObject = {};

// Function to check if the point is within 20 units of the edge
const isNearEdge = (point: number[], sectorSize: number, distance: number) => {
  const [x, y] = point;

  return (
    x <= distance ||
    y <= distance ||
    x >= sectorSize - distance ||
    y >= sectorSize - distance
  );
};

// Function to add additional maps when close to the edge
const addAdjacentMap = (point: number[], sectorSize: number) => {
  const [x, y] = point;

  if (x <= 20) {
    return [x - sectorSize, y];
  }
  if (x >= sectorSize - 20) {
    // Add map to the right
    return [x + sectorSize, y];
  }
  if (y <= 20) {
    // Add map to the top
    return [x, y - sectorSize];
  }
  if (y >= sectorSize - 20) {
    // Add map to the bottom
    return [x, y + sectorSize];
  }
};

const mapGenerator = (point: number[], callback) => {
  if (isNearEdge(point, sectorSize, 20)) {
    // Round to nearest multiple of map size for coordinates
    const roundedPoint = [
      Math.round(point[0] / sectorSize) * sectorSize,
      Math.round(point[1] / sectorSize) * sectorSize,
    ];
    const coord = addAdjacentMap(roundedPoint, sectorSize);
    callback(coord);
  }
};
export default mapGenerator;
