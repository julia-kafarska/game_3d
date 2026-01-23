import { useEffect, useRef, MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";

interface UseMouseLookOptions {
  angleRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  sensitivity?: number;
  minPitch?: number;
  maxPitch?: number;
}

export function useMouseLook({
  angleRef,
  pitchRef,
  sensitivity = 0.003,
  minPitch = -0.3,
  maxPitch = 1.0,
}: UseMouseLookOptions) {
  const { gl, size } = useThree();
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseMove = (event: MouseEvent) => {
      if (lastMousePos.current === null) {
        lastMousePos.current = { x: event.clientX, y: event.clientY };
        return;
      }

      const deltaX = event.clientX - lastMousePos.current.x;
      const deltaY = event.clientY - lastMousePos.current.y;

      // Horizontal rotation (yaw)
      angleRef.current -= deltaX * sensitivity;

      // Vertical rotation (pitch) - clamped
      pitchRef.current += deltaY * sensitivity;
      pitchRef.current = Math.max(
        minPitch,
        Math.min(maxPitch, pitchRef.current),
      );

      lastMousePos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      lastMousePos.current = null;
    };

    const handleMouseEnter = (event: MouseEvent) => {
      lastMousePos.current = { x: event.clientX, y: event.clientY };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [
    gl.domElement,
    angleRef,
    pitchRef,
    sensitivity,
    minPitch,
    maxPitch,
    size,
  ]);

  return {};
}
