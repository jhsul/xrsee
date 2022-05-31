import * as BABYLON from "babylonjs";
import { RCCar } from "./car";
import { createScene } from "./scene";

export const canvas = document.getElementById(
  "renderCanvas"
) as HTMLCanvasElement;
export const engine = new BABYLON.Engine(canvas, true);

const scene = await createScene();
const car = new RCCar("ws://localhost:3001");

(document.getElementById("call") as HTMLButtonElement).onclick = async () => {
  console.log("calling");
  await car.startVideo();
};

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
