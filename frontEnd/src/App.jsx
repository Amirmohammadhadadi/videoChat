import React, { useEffect, useRef, useState } from 'react'
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default function App() {

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const scren = useRef(null)
  const [isCallStart, setIsCallStart] = useState(false)

  useEffect(() => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{
        urls: "stun:stun.l.google.com:19302"
      }]
    })

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate);
      }
    };
    peerConnectionRef.current.ontrack = (event) => {
      console.log("received remote streame", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }
    socket.on("offer", async (offer) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      )
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      socket.emit("answer", answer)
    })

    socket.on("answer", async (answer) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      )
    })
    socket.on("candidate", async (candidate) => {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      )
    })

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    }
  }, [])

  const startCall = async () => {
    setIsCallStart(true);

    //  گرفتن ویدیو از وب‌کم
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localVideoRef.current.srcObject = cameraStream;

    //  گرفتن اسکرین شیر
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    scren.current.srcObject = screenStream;

    // اضافه کردن ترک‌ها به PeerConnection
    cameraStream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, cameraStream));
    screenStream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, screenStream));

    // ساختن offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", offer);
  };





  return (
    <>
      <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: "center", alignItems: 'center' }}>
        <div style={{
          width: '100%', height: '70vh', display: 'flex', flexDirection: 'row', justifyContent: "center", alignItems: 'center',
          gap: "50px"
        }}>
          <video ref={localVideoRef} autoPlay playsInline style={{ width: '300px', height: '300px', border: '6px solid  blue' }} />
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', height: '300px', border: '6px solid red' }} />
          <video ref={scren} autoPlay playsInline style={{ width: '300px', height: '300px', border: '2px solid black' }} />


        </div>
        {!isCallStart && <button onClick={startCall} style={{ width: '100px', height: '50px' }}> start call</button>}
      </div>
    </>
  )
}
