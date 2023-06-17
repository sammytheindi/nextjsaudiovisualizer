// udp-relay.js

const WebSocket = require("ws");
const dgram = require("dgram");
const { RTCPeerConnection } = require("wrtc"); // you will need to install 'wrtc' via npm

// Create a UDP socket to listen for packets
const udpSocket = dgram.createSocket("udp4");

// Create WebSocket connection to the signaling server
const ws = new WebSocket("ws://localhost:3000/api/signaling");

// Create RTCPeerConnection
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

let dataChannel;

ws.on("open", () => {
  // Create a data channel
  dataChannel = peerConnection.createDataChannel("udp-forward");

  // When the connection is established, the data channel is ready to send/receive data
  dataChannel.onopen = () => console.log("Data Channel is open");

  // Create an offer and set it as the local description
  peerConnection
    .createOffer()
    .then((offer) => peerConnection.setLocalDescription(offer))
    .then(() => {
      // Send the offer to the signaling server
      ws.send(JSON.stringify(peerConnection.localDescription));
    });
});

ws.on("message", (message) => {
  const remoteDesc = JSON.parse(message);
  // Set the remote description received from the signaling server
  if (remoteDesc.type === "answer") {
    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
  }
});

// When a new UDP message is received, forward it through the data channel
udpSocket.on("message", (message) => {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(message);
  }
});

// Listen for UDP packets on a specific IP address and port
udpSocket.bind(6284, "192.168.1.43");
