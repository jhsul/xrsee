import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Vector3 } from "@babylonjs/core/Legacy/legacy";
import {
  AdvancedDynamicTexture,
  Button,
  InputText,
  StackPanel,
} from "@babylonjs/gui/2D";
import { currentDevice, devices, scene, setCurrentDevice } from "./main";

import mainGui from "./layouts/mainGui.json";
import { XRSeeDevice } from "./device";

export class XRSeeGUI {
  //guiMesh: BABYLON.Mesh;
  guiTexture: AdvancedDynamicTexture;

  constructor() {
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI(
      "ui",
      true,
      scene
    );
    this.guiTexture.parseContent(mainGui);

    this.setupControls();
    this.hideAddDevicePrompt();
  }

  /**
   * This method basically asigns all the control logic to each
   * GUI control element
   */
  setupControls() {
    // Show the prompt when the add device button is clicked
    (
      this.guiTexture.getControlByName("addDeviceButton") as Button
    ).onPointerDownObservable.add(() => {
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

      const url = `ws://${inputText}`;
      console.log(`Connecting to ${url}`);

      const device = new XRSeeDevice(url);
      devices.push(device);
      setCurrentDevice(device);
      device.start();
    });

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
    });
    moveForwardButton.onPointerUpObservable.add(() => {
      console.log("Move forward released");
    });

    // Move backward button
    const moveBackwardButton = this.guiTexture.getControlByName(
      "moveBackwardButton"
    ) as Button;

    moveBackwardButton.onPointerDownObservable.add(() => {
      console.log("Move backward started");
    });
    moveBackwardButton.onPointerUpObservable.add(() => {
      console.log("Move backward released");
    });
  }
  showAddDevicePrompt() {
    console.log("Showing add device prompt");
    (
      this.guiTexture.getControlByName("addDevicePrompt") as StackPanel
    ).isVisible = true;
  }
  hideAddDevicePrompt() {
    console.log("Showing add device prompt");
    (
      this.guiTexture.getControlByName("addDevicePrompt") as StackPanel
    ).isVisible = false;
  }
}
