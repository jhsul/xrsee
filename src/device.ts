import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { scene } from "./main";

export class XRSeeDevice {
  url: string;
  ws?: WebSocket;
  pc?: RTCPeerConnection;

  deviceMesh: BABYLON.Mesh;
  videoMesh: BABYLON.Mesh;

  audioSource: HTMLAudioElement;
  videoSource: HTMLVideoElement;

  constructor(url: string) {
    this.url = url;

    // Create hidden DOM elements
    this.audioSource = document.createElement("audio");
    this.videoSource = document.createElement("video");

    this.deviceMesh = BABYLON.MeshBuilder.CreateBox("deviceMesh");
    this.deviceMesh.material = new BABYLON.StandardMaterial(
      "deviceTexture",
      scene
    );
    this.deviceMesh.material.wireframe = true;

    this.videoMesh = BABYLON.MeshBuilder.CreatePlane(
      "videoMesh",
      {
        height: 6,
        width: 8,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      },
      scene
    );

    this.videoMesh.parent = this.deviceMesh;

    this.deviceMesh.position = new BABYLON.Vector3(0, 0, 0);
    this.videoMesh.position = new BABYLON.Vector3(0, 2, 0);

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
  }

  /**
   * This method establishes a websocket connection with the car's server,
   * then begins a WebRTC stream and places it in a DOM element.
   */
  async start() {
    this.pc = new RTCPeerConnection();

    // This promise resolves once the websocket connection is established
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.pc?.addEventListener("track", (evt) => {
        if (evt.track.kind == "video") {
          this.videoSource.srcObject = evt.streams[0];
        } else {
          this.audioSource.srcObject = evt.streams[0];
        }
      });

      this.ws.onopen = () => {
        console.log(`Established websocket connection with ${this.url}`);
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
