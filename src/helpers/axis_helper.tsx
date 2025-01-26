import { Text } from "@react-three/drei";
const size = 5;
const fontSize = 1;
const AxisHelper = () => (
  <>
    <axesHelper args={[size]} />
    <Text position={[size, 0, 0]} fontSize={fontSize} color="red">
      X
    </Text>
    <Text position={[0, size, 0]} fontSize={fontSize} color="green">
      Y
    </Text>
    <Text position={[0, 0, size]} fontSize={fontSize} color="blue">
      Z
    </Text>
  </>
);
export default AxisHelper;
