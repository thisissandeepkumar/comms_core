import { Router } from "express";
import * as accountHandlers from "../handlers/account";

export const v1AccountRouter = Router();

v1AccountRouter.post("/register", accountHandlers.registerAccountHandler);
v1AccountRouter.post("/login", accountHandlers.loginAccountHandler)