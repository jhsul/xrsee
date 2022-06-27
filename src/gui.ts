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

const DEFAULT_BUTTON_COLOR = "#333333";

export class XRSeeGUI {
  guiMesh?: BABYLON.Mesh;
  guiTexture: AdvancedDynamicTexture;

  statusText: TextBlock;
  addDeviceButton: Button;
  cancelAddDeviceButton: Button;
  connectDeviceButton: Button;
  urlInputText: InputText;

  turnLeftButton: Button;
  turnRightButton: Button;
  moveForwardButton: Button;
  moveBackwardButton: Button;

  addDevicePrompt: StackPanel;
  controlPanel: StackPanel;

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

    this.statusText = this.guiTexture.getControlByName(
      "statusText"
    ) as TextBlock;
    this.addDeviceButton = this.guiTexture.getControlByName(
      "addDeviceButton"
    ) as Button;
    this.cancelAddDeviceButton = this.guiTexture.getControlByName(
      "cancelAddDeviceButton"
    ) as Button;
    this.connectDeviceButton = this.guiTexture.getControlByName(
      "connectDeviceButton"
    ) as Button;
    this.urlInputText = this.guiTexture.getControlByName(
      "urlInputText"
    ) as InputText;

    this.turnLeftButton = this.guiTexture.getControlByName(
      "turnLeftButton"
    ) as Button;
    this.turnRightButton = this.guiTexture.getControlByName(
      "turnRightButton"
    ) as Button;

    this.moveForwardButton = this.guiTexture.getControlByName(
      "moveForwardButton"
    ) as Button;
    this.moveBackwardButton = this.guiTexture.getControlByName(
      "moveBackwardButton"
    ) as Button;

    this.addDevicePrompt = this.guiTexture.getControlByName(
      "addDevicePrompt"
    ) as StackPanel;
    this.controlPanel = this.guiTexture.getControlByName(
      "controlPanel"
    ) as StackPanel;

    this.setupControls();
    this.hideAddDevicePrompt();
    this.hideControlPanel();
  }

  /**
   * This method basically asigns all the control logic to each
   * GUI control element
   */
  setupControls() {
    this.statusText.text = "XRSee";
    // Show the prompt when the add device button is clicked
    this.addDeviceButton.onPointerDownObservable.add(() => {
      this.showAddDevicePrompt();
    });

    // Hide the prompt when cancel is clicked
    this.cancelAddDeviceButton.onPointerDownObservable.add(() => {
      this.hideAddDevicePrompt();
    });

    // Connect to the car when connect is clicked
    this.connectDeviceButton.onPointerDownObservable.add(() => {
      this.hideAddDevicePrompt();

      const inputText = this.urlInputText.text;

      const addr = inputText;
      console.log(`Connecting to ${addr}`);

      const device = new XRSeeDevice(addr);
      setCurrentDevice(device);

      this.showControlPanel();

      (async () => {
        //await Promise.all([device.startStreaming(), device.startPiCar()]);
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

    this.turnLeftButton.onPointerDownObservable.add(async () => {
      console.log("Turn left started");

      await currentDevice?.turnLeft();
      this.updateControlsFromDirection();
    });
    this.turnLeftButton.onPointerUpObservable.add(async () => {
      console.log("Turn left released");

      //this.updateControlsFromDirection();
    });

    // Turn right button

    this.turnRightButton.onPointerDownObservable.add(async () => {
      console.log("Turn right started");
      await currentDevice?.turnRight();

      this.updateControlsFromDirection();
    });
    this.turnRightButton.onPointerUpObservable.add(async () => {
      console.log("Turn right released");
    });

    // Move forward button
    this.moveForwardButton.onPointerDownObservable.add(() => {
      console.log("Move forward started");
      this.moveForwardButton.background = "#00FF00";
      currentDevice?.moveForward();
    });
    this.moveForwardButton.onPointerUpObservable.add(() => {
      console.log("Move forward released");
      this.moveForwardButton.background = DEFAULT_BUTTON_COLOR;
      currentDevice?.stop();
    });

    // Move backward button
    this.moveBackwardButton.onPointerDownObservable.add(() => {
      console.log("Move backward started");
      this.moveBackwardButton.background = "#00FF00";
      currentDevice?.moveBackward();
    });
    this.moveBackwardButton.onPointerUpObservable.add(() => {
      console.log("Move backward released");
      this.moveBackwardButton.background = DEFAULT_BUTTON_COLOR;
      currentDevice?.stop();
    });
  }
  // COMPONENT VISIBILITY TOGGLES
  // ----------------------------
  showAddDevicePrompt() {
    console.log("Showing add device prompt");
    this.addDevicePrompt.isVisible = true;
  }
  hideAddDevicePrompt() {
    this.addDevicePrompt.isVisible = false;
  }

  showControlPanel() {
    console.log("Showing control panel");
    this.controlPanel.isVisible = true;
  }
  hideControlPanel() {
    console.log("Hiding control panel");
    this.controlPanel.isVisible = false;
  }

  updateControlsFromDirection() {
    switch (currentDevice?.orientation) {
      case "straight":
        this.turnLeftButton.background = DEFAULT_BUTTON_COLOR;
        this.turnRightButton.background = DEFAULT_BUTTON_COLOR;
        break;

      case "left":
        this.turnLeftButton.background = "#0000FF";
        this.turnRightButton.background = DEFAULT_BUTTON_COLOR;
        break;
      case "right":
        this.turnLeftButton.background = DEFAULT_BUTTON_COLOR;
        this.turnRightButton.background = "#0000FF";
        break;
      default:
        console.error("how does the car not have a direction?");
        break;
    }
  }
}
