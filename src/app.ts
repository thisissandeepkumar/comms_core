require("dotenv").config()

import Express from "express"
import { v1AccountRouter } from "./routes/account"
import DB from "./utils/db"
import logger from "./utils/logger"

async function main() {
  try {

    await new DB().initialize()

    const app = Express()

    app.use(Express.json())

    app.use("/api/account/v1", v1AccountRouter)

    app.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`)
    })
  } catch (error) {
    logger.error(error)
  }
}

main()