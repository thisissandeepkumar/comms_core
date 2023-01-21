import { Router } from "express";
import * as accountHandlers from "../handlers/account";
import auth from "../middlewares/auth";

export const v1AccountRouter = Router();

v1AccountRouter.post("/register", accountHandlers.registerAccountHandler);
v1AccountRouter.post("/login", accountHandlers.loginAccountHandler)
v1AccountRouter.get(
  "/persistance",
  auth,
  accountHandlers.persistedUserDetailsHandlers
);
v1AccountRouter.post(
  "/logout",
  auth,
  accountHandlers.logoutHandler
)