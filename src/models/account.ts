import { ObjectId, Filter, Document, FindOptions } from "mongodb";
import Joi from "joi";
import { InvalidDataError } from "../utils/errors";
import {hash, compare} from "bcrypt"
import DB from "../utils/db";
import {sign, verify} from "jsonwebtoken"

export const collectionName = 'accounts';

export interface TokenPayload {
  _id: string
}

export interface FCMToken {
  token: string,
  createdAt: Date,
  validTill: Date
}

export default class Account {
  _id?: ObjectId
  firstName: string
  lastName: string
  email: string
  #password?: string
  createdAt?: Date
  fcmTokens: Array<FCMToken>

  constructor(firstName: string, lastName: string, email: string, createdAt: Date, _id?: ObjectId, password?: string, fcmTokens?: Array<FCMToken> | null) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.createdAt = createdAt;
    this.fcmTokens = [];
    if(_id) this._id = _id;
    if(password) this.#password = password;
    if(fcmTokens) this.fcmTokens = fcmTokens;
  }

  static async parse(data: any) : Promise<Account> {
    try {
      const accountSchema = Joi.object({
        firstName: Joi.string().min(3).max(256).required(),
        lastName: Joi.string().min(3).max(256).required(),
        email: Joi.string().email().required(),
        createdAt: Joi.date().required(),
        password: Joi.string().optional(),
        _id: Joi.custom((value: any, helpers: Joi.CustomHelpers<any>) => {
          if (ObjectId.isValid(value)) return new ObjectId(value);
          return helpers.error("_id is not a valid ObjectId");
        }).optional(),
      });
      await accountSchema.validateAsync(data);
      return new Account(
        data.firstName,
        data.lastName,
        data.email,
        data.createdAt,
        data._id
      );
    } catch (error: any) {
      throw new InvalidDataError(error.message);
    }
  }

  async register(rawPassword: string) : Promise<void> {
    let hashedPassword = await hash(rawPassword, process.env.HASH_ROUNDS? parseInt(process.env.HASH_ROUNDS) : 14);
    delete this._id;
    let result = await DB.instance().collection(collectionName).insertOne({
      ...this,
      password: hashedPassword
    });
    if(!result.acknowledged) {
      throw new Error("Account not created");
    }
    this._id = result.insertedId;
  }

  async validatePassword(rawPassword: string) : Promise<boolean> {
    return await compare(rawPassword, this.#password!);
  }

  static async fetch(filter: Filter<Document>, options?: FindOptions) : Promise<Array<Account>> {
    let accounts: Array<Account> = [];
    let result = await DB.instance().collection(collectionName).find(
      filter, options
    ).toArray()
    for(let i = 0; i < result.length; i++) {
      accounts.push(new Account(
        result[i].firstName,
        result[i].lastName,
        result[i].email,
        result[i].createdAt,
        result[i]._id,
        result[i].password,
        result[i].fcmTokens
      ));
    }
    return accounts;
  }

  async generateToken(fcmToken: string) : Promise<string> {
    await DB.instance().collection(collectionName).updateOne({
      _id: this._id
    }, {
      $addToSet: {
        fcmTokens: {
          token: fcmToken,
          createdAt: new Date(),
          validTill: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
    return await sign({
      _id: this._id?.toHexString()
    }, process.env.JWT_SECRET!, {
      expiresIn: "30d"
    });
  }

  async removeToken(fcmToken: string) : Promise<void> {
    await DB.instance().collection(collectionName).updateOne({
      _id: this._id
    }, {
      $pull: {
        fcmTokens: {
          token: fcmToken
        }
      }
    })
  }

  static async validateToken(token: string) : Promise<TokenPayload> {
    return await verify(token, process.env.JWT_SECRET!) as TokenPayload;
  }
}