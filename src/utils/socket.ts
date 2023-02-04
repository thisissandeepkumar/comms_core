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
import Account, {collectionName as accountCollection} from "../models/account";
import DB from "./db";

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

      socket.on("join", async (data) => {
        let chatroomId = data.chatroomId
        socket.rooms.forEach((room) => {
          socket.leave(room)
        })
        socket.join(chatroomId)
      })

      socket.on("leave", async (data) => {
        socket.rooms.forEach((room) => {
          socket.leave(room)
        })
      })

      socket.on("message", async (message) => {
        let messageObject = await Message.parse({
          ...message,
          senderId: new ObjectId(socket.metaData!.userId!),
          createdAt: new Date(),
        });
        await messageObject.save();
        sendNotification(messageObject);
        socket.to(messageObject.chatroomId.toHexString()).emit("message", messageObject);
      });

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
    let fcmTokensData = await DB.instance()
      .collection(accountCollection)
      .aggregate([
        {
          $match: {
            _id: {
              $in: [chatroom[0].participants],
            },
          },
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            fcmTokens: 1,
          },
        },
      ]).toArray();
    let deliveryTokens : string[] = [];
    let title : string = "";
    fcmTokensData.forEach((data) => {
      if(data._id.toHexString() != message.senderId.toHexString()) {
        data.fcmTokens.forEach((token: any) => {
          deliveryTokens.push(token.token);
        })
      } else {
        title = `${data.firstName} ${data.lastName}`
      }
    })
    publishNotificationsBulk(deliveryTokens, title, message.textContent!, {
      chatroomId: chatroomId.toHexString(),
      route: "/chatroom"
    })
  } catch (error) {
    logger.error(error);
  }
}