import { memo, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { axisMapping } from "../store/gamePad.ts";
import { usePlayerContext } from "../store/player.tsx";
import { Vector3 } from "three";

const radiusInit = 10;

const CameraControls = ({ gamepad, angleRef, angleRef2 }) => {
  const { player } = usePlayerContext();
  // const { camera } = useThree(); // Use the camera from useThree
  const { camera } = useThree();

  useFrame(() => {
    // raycaster.setFromCamera(mouse, camera);
    // const intersects = raycaster.intersectObjects(scene.children, true);
    // if (intersects.length === 3) {
    //   console.log(intersects);
    // }
    if (gamepad && player) {
      // const rX = gamepad.axes[axisMapping.R_STICK_X];
      // const rY = gamepad.axes[axisMapping.R_STICK_Y]; // left stick up and down
      //
      // const rotationSpeed = 0.05;
      let radius = radiusInit;
      //
      const playerPosition = player.position;
      //
      // // Update angles based on gamepad input
      // if (Math.abs(rX) > 0.1) {
      //   angleRef.current += rX * rotationSpeed;
      // }
      // if (Math.abs(rY) > 0.1) {
      //   const newAngle2 = angleRef2.current + rY;
      //   if (newAngle2 >= 3 && newAngle2 < 18) {
      //     angleRef2.current = newAngle2;
      //   }
      // }

      // Calculate the new camera position based on the angle and radius
      camera.position.x =
        playerPosition.x + radius * Math.sin(angleRef.current);
      camera.position.y = Math.PI * angleRef2.current;
      camera.position.z =
        playerPosition.z + radius * Math.cos(angleRef.current);

      // Make the camera look at the player's position
      camera.lookAt(playerPosition.x, -0.5, playerPosition.z);
    }
  });

  useEffect(() => {
    // Set initial camera position
    camera.position.x = radiusInit * Math.sin(angleRef.current);
    camera.position.y = Math.PI * angleRef2.current;
    camera.position.z = 1 + radiusInit * Math.cos(angleRef.current);

    camera.lookAt(0, -0.5, 0); // Point camera to the center or a specific point
  }, [camera, angleRef, angleRef2]);

  return (
    <>
      <OrbitControls
        enableZoom={true}
        minDistance={0}
        maxDistance={70}
        minPolarAngle={0}
        maxPolarAngle={1}
      />
    </>
  );
};

export default memo(CameraControls);
