import { useEffect, useState } from "react";
import { a } from "@react-spring/three";
const FlameLight = () => {
  const [intensity, setIntensity] = useState(2);
  const [color, setColor] = useState("#ff6600");

  useEffect(() => {
    const interval = setInterval(() => {
      setIntensity(12.8 + Math.random() * 2.4); // Flicker between 0.8 and 1.2
      setColor(
        `rgb(
          ${Math.floor(200 + Math.random() * 55)},
          ${Math.floor(100 + Math.random() * 100)},
          0
        )`,
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <a.pointLight
      intensity={intensity}
      color={color}
      castShadow
      position={[0, 2.2, 0]}
    />
  );
};
export default FlameLight;
