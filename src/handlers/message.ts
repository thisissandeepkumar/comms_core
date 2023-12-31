import {Response, NextFunction} from "express"
import { ObjectId } from "mongodb";
import { AuthenticatedRequest } from "../middlewares/auth";
import Message from "../models/message";

export async function createMessageHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
) {
  try {
    const message = await Message.parse({
      ...req.body,
      senderId: req.userId,
      createdAt: new Date(),
    })
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}

export async function fetchMessagesHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
) {
  try {
    const { page, size } = req.query;
    let options = {}
    if(page && size) {
      options = {
        limit: parseInt(size as string),
        skip: (parseInt(page as string) - 1) * parseInt(size as string),
      }
    }
    let messages = await Message.fetch(
      {
        chatroomId: new ObjectId(req.query.chatroomId as string),
      },
      {
        sort: { createdAt: -1 },
        ...options,
      }
    );
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
}