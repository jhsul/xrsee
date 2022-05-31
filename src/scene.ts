import * as BABYLON from "babylonjs";
import { canvas, engine } from "./main";

export const createScene = async () => {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.FreeCamera(
    "mainCamera",
    new BABYLON.Vector3(0, 5, -10),
    scene
  );
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.7;

  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene
  );
  sphere.position.y = 1;

  // Video
  const videoPlane = BABYLON.MeshBuilder.CreatePlane(
    "videoPlane",
    {
      height: 6,
      width: 8,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    },
    scene
  );
  videoPlane.position = new BABYLON.Vector3(0, 0, 0);

  const videoMaterial = new BABYLON.StandardMaterial("videoMaterial", scene);
  const videoTexture = new BABYLON.VideoTexture(
    "video",
    document.getElementById("video") as HTMLVideoElement,
    scene
  );
  videoMaterial.diffuseTexture = videoTexture;
  videoMaterial.roughness = 1;
  videoMaterial.emissiveColor = BABYLON.Color3.White();

  videoPlane.material = videoMaterial;

  scene.onPointerObservable.add((evt) => {
    if (evt.pickInfo?.pickedMesh === videoPlane) {
      console.log("Picked");
      if (videoTexture.video.paused) {
        videoTexture.video.play();
      } else {
        videoTexture.video.pause();
      }
    }
  }, BABYLON.PointerEventTypes.POINTERPICK);

  const env = scene.createDefaultEnvironment();

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [env?.ground!],
  });

  return scene;
};
