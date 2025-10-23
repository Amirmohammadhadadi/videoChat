import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// جای IP سیستم میزبان یا ngrok URL بگذار
const SOCKET_SERVER_URL = "http://192.168.1.10:5000";
const socket = io(SOCKET_SERVER_URL);

export default function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isCallStart, setIsCallStart] = useState(false);

  useEffect(() => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) socket.emit("candidate", event.candidate);
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("offer", async (offer) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    socket.on("answer", async (answer) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("candidate", async (candidate) => {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    };
  }, []);

  const startCall = async () => {
    setIsCallStart(true);

    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localVideoRef.current.srcObject = cameraStream;
    cameraStream.getTracks().forEach((track) =>
      peerConnectionRef.current.addTrack(track, cameraStream)
    );

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer);
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "50px" }}>
        <video ref={localVideoRef} autoPlay playsInline style={{ width: 300, height: 300, border: "6px solid blue" }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 300, height: 300, border: "6px solid red" }} />
      </div>
      {!isCallStart && <button onClick={startCall} style={{ width: 100, height: 50 }}>Start Call</button>}
    </div>
  );
}
