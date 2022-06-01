import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { XRSeeDevice } from "./device";
import { XRSeeGUI } from "./gui";
import { createScene } from "./scene";

export const canvas = document.getElementById(
  "renderCanvas"
) as HTMLCanvasElement;
export const engine = new BABYLON.Engine(canvas, true);

export const scene = await createScene();

export const gui = new XRSeeGUI();
const car = new XRSeeDevice("ws://localhost:3001");
await car.start();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
