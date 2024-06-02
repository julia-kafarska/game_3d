import React, { useEffect, useRef, useState } from "react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

const Castle = () => {
  const group = useRef();
  const [model, setModel] = useState();

  useEffect(() => {
    const loader = new FBXLoader();
    loader.load("../../models/castle/source/Castle.fbx", (fbx) => {
      fbx.traverse(
        (child: {
          isMesh: any;
          material: { map: THREE.Texture; needsUpdate: boolean };
        }) => {
          // "../../models/castle/textures/M_Stone_Base_color.png",
          //   "../../models/castle/textures/M_Stone_Normal_OpenGL.png",
          //   "../../models/castle/textures/M_Stone_Roughness.png",
          if (child.isMesh) {
            const textureLoader = new THREE.TextureLoader();
            const color = textureLoader.load(
              "../../models/castle/textures/M_Stone_Base_color.png",
            );
            child.material.map = color;
            child.material.needsUpdate = true;
          }

          fbx.position.set(52, -1, 5);
          fbx.scale.set(0.3, 0.3, 0.3);
          setModel(fbx);
        },
      );
    });
  }, []);
  return (
    model && (
      <mesh castShadow receiveShadow>
        <primitive ref={group} object={model} />
      </mesh>
    )
  );
};

export default Castle;
