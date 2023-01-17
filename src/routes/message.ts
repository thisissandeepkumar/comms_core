import { Router } from "express";
import * as messageHandlers from "../handlers/message"

export const v1messageRouter = Router();

v1messageRouter.post("/", messageHandlers.createMessageHandler);
v1messageRouter.get("/", messageHandlers.fetchMessagesHandler);