import express from "express";
import mongoose from "mongoose";
import http from "http";
import jwt from "jsonwebtoken";
import cors from "cors";
import { Server } from "socket.io";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Middleware check JWT
function checkJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// MongoDB
mongoose.connect("mongodb://mongodb:27017/chat_service");

// Schema
const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

// Routes
app.get("/messages", checkJWT, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 });
  res.json(messages);
});

app.post("/messages", checkJWT, async (req, res) => {
  const { text } = req.body;
  const sender = req.user.username || req.user.email;
  if (!sender) return res.status(401).json({ error: "Unauthorized" });

  const newMsg = new Message({ sender, text });
  await newMsg.save();

  io.emit("chat message", newMsg);
  res.json(newMsg);
});

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  let token = socket.handshake.auth?.token;
  if (token?.startsWith("Bearer ")) token = token.split(" ")[1];
  if (!token) return next(new Error("No token"));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = user;
    next();
  });
});

io.on("connection", (socket) => {
  const username = socket.user?.username || socket.user?.email || "Unknown";
  console.log("🔌 User connected:", username);

  socket.on("chat message", async (text) => {
    try {
      if (!text || !text.trim()) return; // chặn tin nhắn rỗng

      const newMsg = new Message({
        sender: username,
        text,
      });

      await newMsg.save();

      // chỉ emit cho tất cả client trong namespace này
      io.emit("chat message", newMsg);

      console.log("💬 New message:", newMsg);
    } catch (err) {
      console.error("❌ Error saving message:", err);
      socket.emit("error", { error: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", username);
  });
});


server.listen(3001, () => console.log("🚀 Chat service running on port 3001"));
