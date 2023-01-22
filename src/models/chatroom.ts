import Joi from "joi";
import { Document, Filter, FindOptions, ObjectId } from "mongodb";
import DB from "../utils/db";

export const collectionName = "chatrooms";

export default class Chatroom {
  _id?: ObjectId
  participants: Array<ObjectId>
  createdAt: Date
  updatedAt: Date
  title: string | null
  isGroup: boolean

  constructor(participants: Array<ObjectId>, createdAt: Date, updatedAt: Date, title: string | null, isGroup: boolean, _id?: ObjectId) {
    this.participants = participants;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.title = title;
    this.isGroup = isGroup;
    if(_id) this._id = _id;
  }

  static async parse(data: any) : Promise<Chatroom> {
    const schema = Joi.object({
      participants: Joi.array().items(Joi.custom((value: any, helpers: Joi.CustomHelpers<any>) => {
        if (ObjectId.isValid(value)) return new ObjectId(value);
        return helpers.error("participant is not a valid ObjectId");
      })).required(),
      createdAt: Joi.date().required(),
      updatedAt: Joi.date().required(),
      title: Joi.string().allow(null).default(null),
      isGroup: Joi.boolean().default(false),
    })
    let validatedData = await schema.validateAsync(data);
    return new Chatroom(validatedData.participants, validatedData.createdAt, validatedData.updatedAt, validatedData.title, validatedData.isGroup, validatedData._id?? undefined);
  }

  async save() : Promise<void> {
    let result = await DB.instance().collection(collectionName).insertOne(this);
    if(!result.insertedId) throw new Error("Failed to insert chatroom");
    this._id = result.insertedId;
  }

  static async fetch(filter: Filter<Document>, options?: FindOptions) : Promise<Array<Chatroom>> {
    const result = await DB.instance().collection(collectionName).find(filter, options).toArray();
    return result.map((chatroom) => {
      return new Chatroom(chatroom.participants, chatroom.createdAt, chatroom.updatedAt, chatroom.title, chatroom.isGroup, chatroom._id);
    });
  }

  async checkExistance() : Promise<Chatroom | null> {
    let result = await DB.instance().collection(collectionName).findOne({
      $and: [
        {
          participants: {
            $all: this.participants
          }
        },
        {
          isGroup: false
        }
      ]
    });
    return result != null? new Chatroom(
      result!.participants,
      result!.createdAt,
      result!.updatedAt,
      result!.title,
      result!.isGroup,
      result!._id
    ) : null;
  }
}