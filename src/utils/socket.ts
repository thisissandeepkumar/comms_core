import { Server, Socket } from "socket.io";
import { MongoClient, Collection, Document, ObjectId } from "mongodb";
import logger from "./logger";
import { createAdapter as createRedisAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server as httpServer } from "http";
import Message from "../models/message";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { socketAuth } from "../middlewares/auth";

let io: Server | null = null;
let mongoCollection: Collection<Document> | null = null;

export interface SocketInstance
  extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
  metaData?: {
    userId?: string;
  };
}

export async function initializeSocketServer(app: httpServer): Promise<void> {
  try {
    const redisHostUrl = process.env.REDIS_HOST_URL;
    if (!redisHostUrl) {
      throw new Error("Redis host url not provided");
    }
    io = new Server(app);
    const pubClient = createClient({
      url: redisHostUrl,
    });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io!.adapter(createRedisAdapter(pubClient, subClient));
    });
    io.use(socketAuth);
    logger.info("Socket server attached!");
    io.on("connection", (socket: SocketInstance) => {
      const roomId = socket.handshake.query.room;
      if (!roomId) {
        socket.disconnect();
      } else {
        socket.join(roomId);
        socket.on("message", async (message) => {
          let messageObject = await Message.parse({
            ...message,
            chatroomId: new ObjectId(roomId as string),
            senderId: new ObjectId(socket.metaData!.userId!),
            createdAt: new Date(),
          });
          await messageObject.save();
          socket.to(roomId).emit("message", messageObject);
        });
      }
    });
  } catch (error) {
    throw error;
  }
}