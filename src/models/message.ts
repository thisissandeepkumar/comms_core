import Joi from "joi"
import { Document, Filter, FindOptions, ObjectId } from "mongodb"
import DB from "../utils/db"

export const collectionName = "messages"

export enum MessageType {
  TEXT = "TEXT",
}

export default class Message {
  _id?: ObjectId
  chatroomId: ObjectId
  senderId: ObjectId
  type: MessageType
  textContent: string | null
  createdAt: Date

  constructor(
    chatroomId: ObjectId,
    senderId: ObjectId,
    type: MessageType,
    textContent: string | null,
    createdAt: Date,
    _id?: ObjectId) {
    this.chatroomId = chatroomId
    this.senderId = senderId
    this.type = type
    this.textContent = textContent
    this.createdAt = createdAt
    if(_id) this._id = _id
    }

  static async parse(data: any) : Promise<Message> {
    const schema = Joi.object({
      chatroomId: Joi.custom((values: any, helper: Joi.CustomHelpers<any>) => {
        if (ObjectId.isValid(values)) return new ObjectId(values);
        return helper.error("chatroomId is not a valid ObjectId");
      }).required(),
      senderId: Joi.custom((values: any, helper: Joi.CustomHelpers<any>) => {
        if (ObjectId.isValid(values)) return new ObjectId(values);
        return helper.error("chatroomId is not a valid ObjectId");
      }).required(),
      type: Joi.string().allow(...Object.values(MessageType)).required(),
      textContent: Joi.string().allow(null).required(),
      createdAt: Joi.date().required(),
      _id: Joi.custom((values: any, helper: Joi.CustomHelpers<any>) => {
        if (ObjectId.isValid(values)) return new ObjectId(values);
        return helper.error("_id is not a valid ObjectId");
      }).optional(),
    });
    let validatedData = await schema.validateAsync(data);
    return new Message(validatedData.chatroomId, validatedData.senderId, validatedData.type, validatedData.textContent, validatedData.createdAt, validatedData._id?? undefined);
  }

  async save() : Promise<void> {
    let result = await DB.instance().collection(collectionName).insertOne(this);
    if(!result.acknowledged) throw new Error("Failed to insert message");
    this._id = result.insertedId;
  }

  static async fetch(filter: Filter<Document>, options?: FindOptions) : Promise<Array<Message>> {
    let result = await DB.instance().collection(collectionName).find(filter, options).toArray();
    return result.map((message) => {
      return new Message(message.chatroomId, message.senderId, message.type, message.textContent, message.createdAt, message._id);
    })
  }
}