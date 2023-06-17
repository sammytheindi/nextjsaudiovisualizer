// components/DataChannel.js
import { useEffect, useRef, useState } from "react";

const DataChannel = () => {
  const peerConnection = useRef();
  const dataChannel = useRef();
  const signalingServer = useRef();
  const [receivedData, setReceivedData] = useState(null);

  useEffect(() => {
    signalingServer.current = new WebSocket(
      "ws://localhost:3000/api/signaling"
    );

    signalingServer.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (!peerConnection.current) return;

      if (data.type === "offer") {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        signalingServer.current.send(
          JSON.stringify(peerConnection.current.localDescription)
        );
      }
    };

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    peerConnection.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      dataChannel.current.onmessage = (event) => {
        setReceivedData(event.data);
      };
    };

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (signalingServer.current) {
        signalingServer.current.close();
      }
    };
  }, []);

  return <div>{receivedData && <p>Received Data: {receivedData}</p>}</div>;
};

export default DataChannel;
