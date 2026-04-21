import { app } from "./src/app"
import dotenv from "dotenv"
import connectDB from "./src/config/db"
import http from "http";
import { initSocket } from "./src/socketServer";
import "./src/jobs/workers/worker";
import "./src/jobs/workers/notification.worker";

dotenv.config()

const server = http.createServer(app);

initSocket(server);

// create server
server.listen(process.env.PORT, () => {
  console.log("server is connected with port", process.env.PORT)
  connectDB()
})
