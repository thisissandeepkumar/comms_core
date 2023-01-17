import Joi from "joi";
import { MongoClient, Db, ObjectId } from "mongodb";
import logger from "./logger";

let db: DB | null = null;

export default class DB {
  private url: string;
  private db: Db | null = null;
  private clientConnection: MongoClient | null = null;

  constructor() {
    if (!process.env.mongoUrl) {
      throw new Error("MongoDB URL not set");
    }
    this.url = process.env.mongoUrl;
  }

  async initialize(): Promise<void> {
    if (!db) {
      const client = await new MongoClient(this.url, {
        minPoolSize: 10,
        maxPoolSize: 25,
      });
      await new Promise<void>((resolve, reject) => {
        client
          .connect()
          .then(async (clientConnection) => {
            logger.info("Connected to MongoDB");
            this.clientConnection = clientConnection;
            this.db = clientConnection.db();
            db = this;
            resolve(void 0);
          })
          .catch((err) => {
            reject(err);
          });
      });
    }
  }

  static instance(): Db {
    if (!db) {
      throw new Error("DB not initialized");
    }
    return db!.db!;
  }

  static async release(): Promise<void> {
    if (!db) {
      throw new Error("DB not initialized");
    }
    await db.clientConnection!.close();
  }

  static joiObjectIdValidator(value: any, helpers: Joi.CustomHelpers<any>) {
    if (ObjectId.isValid(value)) return value;
    return helpers.error("any.invalid");
  }

  static joiObjectIdNullValidator(value: any, helpers: Joi.CustomHelpers<any>) {
    if (value === null) return value;
    if (ObjectId.isValid(value)) return value;
    return helpers.error("any.invalid");
  }
}
