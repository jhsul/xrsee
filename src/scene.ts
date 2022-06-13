import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { canvas, engine } from "./main";

export const createScene = async () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  const camera = new BABYLON.FreeCamera(
    "mainCamera",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  camera.setTarget(new BABYLON.Vector3(0, 1, 1));
  //camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.7;
  const env = scene.createDefaultEnvironment();

  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      //sessionMode: "immersive-ar",
    },
    floorMeshes: [env?.ground!],
  });

  return scene;
};
