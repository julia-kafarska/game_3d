import { useEffect, useRef, MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";
import { playerSettings, cameraSettings } from "../../constants/settings";
import { useCameraStore } from "../../store/camera-store";

interface UseMouseLookOptions {
  angleRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  sensitivity?: number;
}

export function useMouseLook({
  angleRef,
  pitchRef,
  sensitivity = playerSettings.mouseSensitivity,
}: UseMouseLookOptions) {
  const cameraMode = useCameraStore((state) => state.mode);

  // Get pitch limits based on camera mode
  const getPitchLimits = () => {
    if (cameraMode === 3) {
      return {
        min: cameraSettings.firstPerson.minPitch,
        max: cameraSettings.firstPerson.maxPitch,
      };
    }
    return {
      min: playerSettings.pitchMin,
      max: playerSettings.pitchMax,
    };
  };
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

      // Vertical rotation (pitch) - clamped based on camera mode
      const { min: minPitch, max: maxPitch } = getPitchLimits();
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
  }, [gl.domElement, angleRef, pitchRef, sensitivity, cameraMode, size]);

  return {};
}
