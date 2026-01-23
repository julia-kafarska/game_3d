interface HoverIndicatorProps {
  position: [number, number, number];
}

export function HoverIndicator({ position }: HoverIndicatorProps) {
  return (
    <mesh position={position}>
      <boxGeometry attach="geometry" args={[1, 0.1, 1]} />
      <meshBasicMaterial color="red" transparent opacity={0.3} />
    </mesh>
  );
}
