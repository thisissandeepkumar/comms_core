import {Response, NextFunction} from "express"
import { ObjectId } from "mongodb";
import { AuthenticatedRequest } from "../middlewares/auth";
import Chatroom from "../models/chatroom";

export async function createChatroomHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
) {
  try {
    const chatroom = await Chatroom.parse({
      ...req.body,
      participants: [
        ...req.body.participants,
        req.userId
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isGroup: req.body.participants.length > 1
    })
    await chatroom.save();
    res.status(201).json(chatroom);
  } catch (error) {
    next(error);
  }
}

export async function fetchChatroomHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const chatrooms = await Chatroom.fetch(
      {
        participants: {
          $in: [new ObjectId(req.userId)],
        },
      },
      {
        sort: {
          updatedAt: -1,
        },
      }
    );
    res.status(200).json(chatrooms);
  } catch (error) {
    next(error);
  }
}