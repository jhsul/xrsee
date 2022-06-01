import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Vector3 } from "@babylonjs/core/Legacy/legacy";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui/2D";
import { scene } from "./main";

export class XRSeeGUI {
  guiMesh: BABYLON.Mesh;
  guiTexture: AdvancedDynamicTexture;

  constructor() {
    this.guiMesh = BABYLON.MeshBuilder.CreatePlane(
      "guiPlane",
      {
        size: 3,
      },
      scene
    );
    this.guiMesh.position = new Vector3(0, 0, 0);
    this.guiTexture = AdvancedDynamicTexture.CreateForMesh(
      this.guiMesh,
      1024,
      1024
    );

    const testButton = Button.CreateSimpleButton("testBtn", "Connect");
    testButton.width = 1;
    testButton.height = 0.4;
    testButton.color = "white";
    testButton.fontSize = 50;
    testButton.background = "red";
    testButton.onPointerClickObservable.add(() => {
      console.log("connecting!");
    });

    this.guiTexture.addControl(testButton);
  }
}
