import { useGLTF } from "@react-three/drei";
import { IModel } from "../src/interfaces/model";

const Model = ({ url, position }: IModel) => {
  const { scene } = useGLTF(url);

  return (
    <mesh receiveShadow castShadow>
      <primitive object={scene} position={position || [0, 0, 0]} />
    </mesh>
  );
};

export default Model;
