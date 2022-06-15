import * as BABYLON from "babylonjs";
import * as ZapparBabylon from "@zappar/zappar-babylonjs";
import { XRSeeDevice } from "./device";
import { XRSeeGUI } from "./gui";
import { Quaternion, Vector3 } from "babylonjs";

// MAIN APP STATE
//---------------
export let currentDevice: XRSeeDevice;
export const setCurrentDevice = (device: XRSeeDevice) => {
  currentDevice = device;
};

export const canvas = document.createElement("canvas");
canvas.onselectstart = () => false;
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});

export const scene = new BABYLON.Scene(engine);

const light = new BABYLON.HemisphericLight(
  "light",
  new BABYLON.Vector3(0, 1, 0),
  scene
);

const gui = new XRSeeGUI(true);
/*
const env = scene.createDefaultEnvironment();

const xr = await scene.createDefaultXRExperienceAsync({
  uiOptions: {
    //sessionMode: "immersive-ar",
  },
  floorMeshes: [env?.ground!],
});
*/
export const camera = new ZapparBabylon.Camera("camera", scene);
//--------------

ZapparBabylon.permissionRequestUI().then((granted) => {
  if (granted) camera.start();
  else ZapparBabylon.permissionDeniedUI();
});

const imageTracker = new ZapparBabylon.ImageTrackerLoader().load(
  require("file-loader!./assets/autoidlogo.zpt").default
);
export const trackerTransformNode = new ZapparBabylon.ImageAnchorTransformNode(
  "tracker",
  camera,
  imageTracker,
  scene
);

/*
// Add some content to the image tracker
const box = BABYLON.Mesh.CreateBox(
  "box",
  1,
  scene,
  false,
  BABYLON.Mesh.DOUBLESIDE
);
box.parent = trackerTransformNode;
box.visibility = 0;
*/

imageTracker.onVisible.bind(() => {});

imageTracker.onNotVisible.bind(() => {
  //box.visibility = 0;
});

window.addEventListener("resize", () => {
  engine.resize();
});

// Set up our render loop
engine.runRenderLoop(() => {
  camera.updateFrame();
  scene.render();
});
