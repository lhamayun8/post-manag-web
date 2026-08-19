import { io } from "socket.io-client";

const socket = io(
  "https://exquisite-empathy-production-97e7.up.railway.app",
  {
    transports: ["websocket", "polling"],
  }
);

export default socket;