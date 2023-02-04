import { Server, Socket } from "socket.io";
import { MongoClient, Collection, Document, ObjectId } from "mongodb";
import logger from "./logger";
import { createAdapter as createRedisAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { Server as httpServer } from "http";
import Message from "../models/message";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { socketAuth } from "../middlewares/auth";
import { publishNotificationsBulk } from "./firebase";
import Chatroom, { collectionName as chatroomCollection } from "../models/chatroom";
import Account from "../models/account";

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
      const roomId = socket.handshake.headers["roomid"];
      if (!roomId) {
        socket.disconnect();
      } else {
        socket.join(roomId);
        socket.on("disconnect", () => {
          logger.info(`User ${socket.metaData!.userId} disconnected from room ${roomId}`)
        })
        socket.on("message", async (message) => {
          let messageObject = await Message.parse({
            ...message,
            chatroomId: new ObjectId(roomId as string),
            senderId: new ObjectId(socket.metaData!.userId!),
            createdAt: new Date(),
          });
          await messageObject.save();
          sendNotification(messageObject);
          socket.to(roomId).emit("message", messageObject);
        });
        socket.on("p2p", async (message) => {
          socket.to(roomId).emit("p2p", {
            ...message,
            senderId: socket.metaData!.userId,
          });
        })
      }
    });
  } catch (error) {
    throw error;
  }
}

export async function sendNotification(message: Message) {
  try {
    let chatroomId = message.chatroomId;
    let chatroom = await Chatroom.fetch({
      _id: chatroomId,
    })
    if (chatroom) {
      let participants = chatroom[0].participants
      let deliveryUsers = participants.filter((participant) => {
        return participant != message.senderId
      })
      let deliveryFcmUserObjects = await Account.fetch({
        _id: {
          $in: [...deliveryUsers, message.senderId],
        },
      });
      let fcmTokens: Array<string> = []
      deliveryFcmUserObjects.map((user) => {
        if(user.fcmTokens.length !== 0 && user._id != message.senderId) {
          user.fcmTokens.map((token) => {
            fcmTokens.push(token.token)
          })
        } 
      });
      let sender = deliveryFcmUserObjects.find((user) => {
        return user._id?.toHexString() == message.senderId.toHexString()
      })
      let senderName = `${sender!.firstName} ${sender!.lastName}`
      publishNotificationsBulk(fcmTokens, senderName, message.textContent!, {
        route: "/chatroom",
        chatroomId: chatroomId.toHexString(),
      });
    }
  } catch (error) {
    logger.error(error);
  }
}