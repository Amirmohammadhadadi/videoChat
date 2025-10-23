import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../../providers/Socket'
import { useNavigate } from 'react-router-dom'
export default function Home() {
    const { socket } = useSocket()
    const [email, setEmail] = useState('')
    const [roomId, setRoomId] = useState('')

    const navigate = useNavigate()
    const handelRoomJoined = useCallback(({ roomId }) => {
        navigate(`/room/${roomId}`)
    }, [navigate])


    useEffect(() => {
        socket.on("joined-room", handelRoomJoined)
        return () => {
            socket.off("joined-room", handelRoomJoined)

        }
    }, [handelRoomJoined, socket])

    const handleJoinRoom = () => {
        socket.emit("join-room", { roomId: roomId, emailId: email })
    }
    return (
        <>
            <div className='main' style={{ height: "100vh", width: "100vw", display: 'flex', flexDirection: 'column', alignItems: "center", justifyContent: "center", gap: '16px' }}>
                <input type="text" onChange={(e) => { setEmail(e.target.value) }} placeholder='email' style={{ width: '200px', height: '50px', border: "1px solid black", borderRadius: '8px', padding: "8px" }} />
                <input type="text" onChange={(e) => { setRoomId(e.target.value) }} placeholder='chat room' style={{ width: '200px', height: '50px', borderRadius: '8px', padding: "8px" }} />
                <button onClick={handleJoinRoom} style={{ width: '200px', height: '50px', backgroundColor: '#b2d1ccff' }}>send data </button>

            </div>
        </>
    )
}
