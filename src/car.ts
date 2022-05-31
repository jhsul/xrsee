export class RCCar {
  url: string;
  ws?: WebSocket;
  pc?: RTCPeerConnection;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * This method establishes a websocket connection with the car's server,
   * then begins a WebRTC stream and places it in a DOM element.
   */
  async startVideo() {
    // This promise resolves once the websocket connection is established
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.pc = new RTCPeerConnection();

      this.pc.addEventListener("track", function (evt) {
        if (evt.track.kind == "video") {
          (document.getElementById("video") as HTMLVideoElement).srcObject =
            evt.streams[0];
        } else {
          (document.getElementById("audio") as HTMLAudioElement).srcObject =
            evt.streams[0];
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
