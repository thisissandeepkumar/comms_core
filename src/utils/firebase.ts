import {App, initializeApp, cert} from "firebase-admin/app"
import {getMessaging} from "firebase-admin/messaging"
import logger from "./logger"
const serviceAccount = require("../../firebase.json")

let firebaseApp : App | null = null

interface NotificationData {
  route: string
  chatroomId?: string | null
}

export function initializeFirebase() {
  try {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    })
  } catch (error) {
    throw error
  }
}

export async function publishNotification(fcmToken: string, title : string, body: string) {
  try {
    if(!firebaseApp) {
      initializeFirebase()
    }
    let message = {
      notification: {
        title,
        body
      },
      token: fcmToken
    }
    return await getMessaging().send(message)
  } catch (error) {
    logger.error(error)
  }
}

export async function publishNotificationsBulk(
  fcmTokens: Array<string>,
  title: string,
  body: string,
  data: NotificationData | null = null
) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }
    let message: any = {
      notification: {
        title,
        body,
      },
      tokens: fcmTokens,
    };
    if (data) {
      message = {
        ...message,
        data,
      };
    }
    return await getMessaging().sendMulticast(message);
  } catch (error) {
    logger.error(error);
  }
}