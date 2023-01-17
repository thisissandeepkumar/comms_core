require("dotenv").config()

import Express from "express"
import { createServer } from "http"
import { TokenExpiredError } from "jsonwebtoken"
import auth from "./middlewares/auth"
import { v1AccountRouter } from "./routes/account"
import { v1ChatroomRouter } from "./routes/chatroom"
import { v1messageRouter } from "./routes/message"
import DB from "./utils/db"
import { AccountDisabledError, DuplicateEntryError, InvalidDataError, NotFoundError, UnauthorizedError } from "./utils/errors"
import logger from "./utils/logger"
import { initializeSocketServer } from "./utils/socket"

async function main() {
  try {

    await new DB().initialize()

    const app = Express()

    const httpServer = createServer(app);
    await initializeSocketServer(httpServer)

    app.use(Express.json())

    app.use("/api/account/v1", v1AccountRouter)
    app.use("/api/chatroom/v1", auth, v1ChatroomRouter)
    app.use("/api/message/v1", auth, v1messageRouter)

    // Error Handling
    app.use((err: Error, req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      let statusCode: number = 500;
      switch (err.constructor) {
        case DuplicateEntryError:
          statusCode = 409;
          break;
        case InvalidDataError:
          statusCode = 400;
          break;
        case NotFoundError:
          statusCode = 404;
          break;
        case TokenExpiredError:
          statusCode = 498;
          break;
        case UnauthorizedError:
          statusCode = 401;
          break;
        case AccountDisabledError:
          statusCode = 403;
          break;
        default:
          statusCode = 500;
          logger.error(err);
          break;
      }

      res.status(statusCode).json({
        status: "error",
        error: err.message
      })
    })

    httpServer.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`)
    })
  } catch (error) {
    logger.error(error)
  }
}

main()