import * as BABYLON from "babylonjs";
import { scene, trackerTransformNode } from "./main";

const NGROK_WSS = "wss://1d8b-108-20-144-23.ngrok.io";
const NGROK_CAR = "https://b2df-108-20-144-23.ngrok.io";

const USE_NGROK = true;

const VIDEO_SIZE = 3;

export class XRSeeDevice {
  addr: string;

  wssPort: number;
  carPort: number;

  wssAddr: string;
  carAddr: string;

  ws?: WebSocket;
  pc?: RTCPeerConnection;

  // The device mesh is just a wireframe outline showing the device's location
  deviceMesh: BABYLON.Mesh;
  videoMesh: BABYLON.Mesh;

  audioSource: HTMLAudioElement;
  videoSource: HTMLVideoElement;

  constructor(addr: string, wssPort = 3001, carPort = 8000) {
    this.addr = addr;
    this.wssPort = wssPort;
    this.carPort = carPort;

    this.wssAddr = USE_NGROK ? NGROK_WSS : `ws://${addr}:${wssPort}`;
    this.carAddr = USE_NGROK ? NGROK_CAR : `http://${addr}:${carPort}`;

    // Create hidden DOM elements
    this.audioSource = document.createElement("audio");
    this.videoSource = document.createElement("video");

    this.videoSource.autoplay = true;

    this.deviceMesh = BABYLON.MeshBuilder.CreateBox("deviceMesh", {
      size: 0.25, // assume the device is roughly 25cm x 25cm x 25cm
    });

    this.deviceMesh.material = new BABYLON.StandardMaterial(
      "deviceTexture",
      scene
    );
    //this.deviceMesh.material.wireframe = true;

    this.videoMesh = BABYLON.MeshBuilder.CreatePlane(
      "videoMesh",
      {
        // Received video is 640x480
        height: VIDEO_SIZE * 0.75,
        width: VIDEO_SIZE,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      scene
    );

    this.deviceMesh.parent = trackerTransformNode;
    this.videoMesh.parent = this.deviceMesh;

    this.deviceMesh.position = new BABYLON.Vector3(0, 0, 0);
    this.videoMesh.position = new BABYLON.Vector3(0, 1, 0);
    this.videoMesh.rotation.x = Math.PI / 2;
    this.videoMesh.rotation.z = Math.PI;

    // Set the videoMesh texture to the video in this.videoSource
    // This will be empty until the WebRTC connection is established
    const videoMaterial = new BABYLON.StandardMaterial("videoMaterial", scene);
    const videoTexture = new BABYLON.VideoTexture(
      "video",
      this.videoSource,
      scene
    );

    videoMaterial.diffuseTexture = videoTexture;
    videoMaterial.roughness = 1;
    videoMaterial.emissiveColor = BABYLON.Color3.White();

    this.videoMesh.material = videoMaterial;

    /*
    scene.onPointerObservable.add((evt) => {
      if (evt.pickInfo?.pickedMesh === this.videoMesh) {
        console.log("Picked");
        if (videoTexture.video.paused) {
          videoTexture.video.play();
        } else {
          videoTexture.video.pause();
        }
      }
    }, BABYLON.PointerEventTypes.POINTERPICK);
    */
  }

  async startPiCar() {
    await fetch(`${this.carAddr}/run/?action=setup`, {
      mode: "no-cors",
    });
    await fetch(`${this.carAddr}/run/?action=bwready`, {
      mode: "no-cors",
    });
    await fetch(`${this.carAddr}/run/?action=fwready`, {
      mode: "no-cors",
    });

    return true;
  }

  async moveForward() {
    await fetch(`${this.carAddr}/run/?action=backward`, {
      mode: "no-cors",
    });
  }
  async moveBackward() {
    await fetch(`${this.carAddr}/run/?action=forward`, {
      mode: "no-cors",
    });
  }

  async stop() {
    await fetch(`${this.carAddr}/run/?action=stop`, {
      mode: "no-cors",
    });
  }
  /**
   * This method establishes a websocket connection with the car's server,
   * then begins a WebRTC stream and places it in a DOM element.
   */
  async startStreaming() {
    this.pc = new RTCPeerConnection();

    // This promise resolves once the websocket connection is established
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wssAddr);

      this.pc?.addEventListener("track", (evt) => {
        if (evt.track.kind == "video") {
          this.videoSource.srcObject = evt.streams[0];
        } else {
          this.audioSource.srcObject = evt.streams[0];
        }
      });

      this.ws.onopen = () => {
        console.log(`Established websocket connection with ${this.wssAddr}`);
        resolve(undefined);
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onmessage = async (ev) => {
        const message = JSON.parse(ev.data);

        console.log(`Received message:`);
        console.log(message);

        switch (message.type) {
          case "answer":
            console.log("Setting answer");
            await this.pc?.setRemoteDescription(message.body);
            break;
          default:
            console.error(`Bad message type: ${message.type}`);
            break;
        }
      };
    });
    if (!this.ws) {
      console.error("Websocket connection is fucked, aborting");
      return;
    }

    // At this point, a websocket connection is established
    // Now we can do the WebRTC offer
    if (!this.pc) {
      console.error("No PC, aborting");
      return;
    }

    this.pc.addTransceiver("video", { direction: "recvonly" });
    this.pc.addTransceiver("audio", { direction: "recvonly" });

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // This promise gets resolved when pc.iceGatheringState === "complete"
    await new Promise((resolve, reject) => {
      if (this.pc?.iceGatheringState === "complete") {
        resolve(undefined);
      } else {
        const checkState = () => {
          if (this.pc?.iceGatheringState === "complete") {
            this.pc?.removeEventListener("icegatheringstatechange", checkState);
            resolve(undefined);
          }
        };
        this.pc?.addEventListener("icegatheringstatechange", checkState);
      }
    });

    console.log("Offer and ICE gathering complete");

    const finalOffer = this.pc.localDescription;

    const offerMessage = {
      type: "offer",
      body: {
        sdp: finalOffer?.sdp,
        type: finalOffer?.type,
      },
    };
    this.ws.send(JSON.stringify(offerMessage));
  }
}
