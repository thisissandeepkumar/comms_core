import {Response, NextFunction} from "express"
import { ObjectId } from "mongodb";
import { AuthenticatedRequest } from "../middlewares/auth";
import Chatroom, {collectionName as chatroomCollection} from "../models/chatroom";
import {collectionName as accountCollection} from "../models/account"
import DB from "../utils/db";

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
    const doesExist = await chatroom.checkExistance()
    if(doesExist) {
      res.status(409).json({
        message: "Chatroom already exists"
      })
    } else {
      await chatroom.save();
      res.status(201).json(chatroom);
    }
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
    // const chatrooms = await Chatroom.fetch(
    //   {
    //     participants: {
    //       $in: [new ObjectId(req.userId)],
    //     },
    //   },
    //   {
    //     sort: {
    //       updatedAt: -1,
    //     },
    //   }
    // );
    const result = await DB.instance().collection(chatroomCollection).aggregate([
      {
        $match: {
          participants: {
            $in: [new ObjectId(req.userId)],
          },
        }
      },
      {
        $lookup: {
          from: accountCollection,
          localField: "participants",
          foreignField: "_id",
          as: "participants"
        }
      },
      {
        $project: {
          participants: {
            password: 0,
          }
        }
      }
    ]).toArray()
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}