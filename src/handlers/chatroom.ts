import {Response, NextFunction} from "express"
import { ObjectId } from "mongodb";
import { AuthenticatedRequest } from "../middlewares/auth";
import Chatroom, {collectionName as chatroomCollection} from "../models/chatroom";
import Account, {collectionName as accountCollection} from "../models/account"
import DB from "../utils/db";

export async function createChatroomHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
) {
  try {
    const account = await Account.fetch({
      email: req.body.email as string
    })
    if(account.length === 0) {
      res.status(404).json({
        message: "Account not found"
      })
    } else {
      const chatroom = await Chatroom.parse({
        title: null,
        participants: [account[0]._id, req.userId],
        createdAt: new Date(),
        updatedAt: new Date(),
        isGroup: false
        // isGroup: req.body.participants.length > 1,
      });
      const doesExist = await chatroom.checkExistance();
      if (doesExist != null) {
        res.status(409).json({
          message: "Chatroom already exists",
          chatroom: await doesExist.aggregatedFetch(),
        });
      } else {
        await chatroom.save();
        res.status(201).json(await chatroom.aggregatedFetch());
      }
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