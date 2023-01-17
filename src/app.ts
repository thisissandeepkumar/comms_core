require("dotenv").config()

import Express from "express"
import { createServer } from "http"
import auth from "./middlewares/auth"
import { v1AccountRouter } from "./routes/account"
import { v1ChatroomRouter } from "./routes/chatroom"
import { v1messageRouter } from "./routes/message"
import DB from "./utils/db"
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

    httpServer.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`)
    })
  } catch (error) {
    logger.error(error)
  }
}

main()