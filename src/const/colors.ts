import * as THREE from "three";
//empty constructor - will default white
export const color1 = new THREE.Color();

//Hexadecimal color (recommended)
export const color2 = new THREE.Color(0xff0000);

//RGB string
const color3 = new THREE.Color("rgb(255, 0, 0)");
const color4 = new THREE.Color("rgb(100%, 0%, 0%)");

//X11 color name - all 140 color names are supported.
//Note the lack of CamelCase in the name
const color5 = new THREE.Color("skyblue");

//HSL string
const color6 = new THREE.Color("hsl(0, 100%, 50%)");

//Separate RGB values between 0 and 1
const color7 = new THREE.Color(1, 0, 0);
