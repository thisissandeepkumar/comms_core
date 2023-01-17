import { Router } from "express";
import * as chatroomHandlers from "../handlers/chatroom";

export const v1ChatroomRouter = Router();

v1ChatroomRouter.post("/", chatroomHandlers.createChatroomHandler);
v1ChatroomRouter.get("/", chatroomHandlers.fetchChatroomHandler);