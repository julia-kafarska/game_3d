import { Cloud, Clouds } from "@react-three/drei";
import { memo } from "react";
import { useControls } from "leva";

const CloudsComponent = () => {
  const { clouds } = useControls({
    clouds: true,
  });

  return (
    <Clouds visible={clouds} position={[0, 20, 0]}>
      <Cloud
        seed={11}
        color="white"
        speed={0.2}
        bounds={[40, 0, 40]}
        volume={30}
        segments={23}
        opacity={0.8}
      />
    </Clouds>
  );
};

export default memo(CloudsComponent);
