import * as BABYLON from "babylonjs";
import {
  AdvancedDynamicTexture,
  Button,
  InputText,
  StackPanel,
  TextBlock,
} from "babylonjs-gui";
import { currentDevice, scene, setCurrentDevice } from "./main";

import mainGui from "./layouts/mainGui.json";
import { XRSeeDevice } from "./device";

export class XRSeeGUI {
  guiMesh?: BABYLON.Mesh;
  guiTexture: AdvancedDynamicTexture;

  constructor(fullscreen = false) {
    if (fullscreen) {
      this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI(
        "gui",
        true,
        scene
      );
    } else {
      this.guiMesh = BABYLON.MeshBuilder.CreatePlane(
        "guiPlane",
        { size: 0.5 },
        scene
      );
      this.guiMesh.position = new BABYLON.Vector3(0, 0, 2);
      this.guiMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

      this.guiTexture = AdvancedDynamicTexture.CreateForMesh(
        this.guiMesh,
        400,
        400
      );
    }

    /*
    full screen mode - not using anymore
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "ui",
      true,
      scene
    );
    */
    /*
    var button1 = Button.CreateSimpleButton("but1", "Click Me");
    button1.width = 1;
    button1.height = 0.4;
    button1.color = "white";
    button1.fontSize = 50;
    button1.background = "green";
    button1.onPointerUpObservable.add(function () {
      alert("you did it!");
    });
    this.guiTexture.addControl(button1);
    */
    this.guiTexture.parseContent(mainGui);

    this.setupControls();
    this.hideAddDevicePrompt();
    this.hideControlPanel();
  }

  /**
   * This method basically asigns all the control logic to each
   * GUI control element
   */
  setupControls() {
    (this.guiTexture.getControlByName("statusText") as TextBlock).text =
      "XRSee";
    // Connect to the car when connect is clicked
    // Show the prompt when the add device button is clicked
    (
      this.guiTexture.getControlByName("addDeviceButton") as Button
    ).onPointerDownObservable.add(() => {
      console.log("HELLLOOO");
      this.showAddDevicePrompt();
    });

    // Hide the prompt when cancel is clicked
    (
      this.guiTexture.getControlByName("cancelAddDeviceButton") as Button
    ).onPointerDownObservable.add(() => {
      this.hideAddDevicePrompt();
    });

    // Connect to the car when connect is clicked
    (
      this.guiTexture.getControlByName("connectDeviceButton") as Button
    ).onPointerDownObservable.add(() => {
      this.hideAddDevicePrompt();

      const inputText = (
        this.guiTexture.getControlByName("urlInputText") as InputText
      ).text;

      const addr = inputText;
      console.log(`Connecting to ${addr}`);

      const device = new XRSeeDevice(addr);
      setCurrentDevice(device);

      this.showControlPanel();

      (async () => {
        await device.startStreaming();
        await device.startPiCar();
      })();
    });

    /*
      const inputText = (
        this.guiTexture.getControlByName("urlInputText") as InputText
      ).text;

      const url = inputText.startsWith("wss") ? inputText : `ws://${inputText}`;
      console.log(`Connecting to ${url}`);

      const device = new XRSeeDevice(url);
      devices.push(device);
      setCurrentDevice(device);
      device.start();
      */
    //});

    // MOVEMENT CONTROLS
    // Eventually these will need to be forwarded to currentDevice
    // Which will send appropriate websocket messages
    //-----------------------

    // Turn left button
    const turnLeftButton = this.guiTexture.getControlByName(
      "turnLeftButton"
    ) as Button;

    turnLeftButton.onPointerDownObservable.add(() => {
      console.log("Turn left started");
    });
    turnLeftButton.onPointerUpObservable.add(() => {
      console.log("Turn left released");
    });

    // Turn right button
    const turnRightButton = this.guiTexture.getControlByName(
      "turnRightButton"
    ) as Button;

    turnRightButton.onPointerDownObservable.add(() => {
      console.log("Turn right started");
    });
    turnRightButton.onPointerUpObservable.add(() => {
      console.log("Turn right released");
    });

    // Move forward button
    const moveForwardButton = this.guiTexture.getControlByName(
      "moveForwardButton"
    ) as Button;

    moveForwardButton.onPointerDownObservable.add(() => {
      console.log("Move forward started");
      currentDevice?.moveForward();
    });
    moveForwardButton.onPointerUpObservable.add(() => {
      console.log("Move forward released");
      currentDevice?.stop();
    });

    // Move backward button
    const moveBackwardButton = this.guiTexture.getControlByName(
      "moveBackwardButton"
    ) as Button;

    moveBackwardButton.onPointerDownObservable.add(() => {
      console.log("Move backward started");
      currentDevice?.moveBackward();
    });
    moveBackwardButton.onPointerUpObservable.add(() => {
      console.log("Move backward released");
      currentDevice?.stop();
    });
  }
  // COMPONENT VISIBILITY TOGGLES
  // ----------------------------
  showAddDevicePrompt() {
    console.log("Showing add device prompt");
    (
      this.guiTexture.getControlByName("addDevicePrompt") as StackPanel
    ).isVisible = true;
  }
  hideAddDevicePrompt() {
    console.log("Hiding add device prompt");
    (
      this.guiTexture.getControlByName("addDevicePrompt") as StackPanel
    ).isVisible = false;
  }

  showControlPanel() {
    console.log("Showing control panel");
    (this.guiTexture.getControlByName("controlPanel") as StackPanel).isVisible =
      true;
  }
  hideControlPanel() {
    console.log("Hiding control panel");
    (this.guiTexture.getControlByName("controlPanel") as StackPanel).isVisible =
      false;
  }
}
