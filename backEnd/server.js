// server.js
import express from "express";
import { createServer } from "http"; // اگر از ngrok استفاده می‌کنیم http کافی است
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors({
    origin: "*"  // اجازه می‌دهد هر فرانت‌اند (Netlify) وصل شود
}));

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
    });

    socket.on("candidate", (candidate) => {
        socket.broadcast.emit("candidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// استفاده از پورت دینامیک برای سرویس آنلاین (Render/Railway) یا پورت لوکال 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
