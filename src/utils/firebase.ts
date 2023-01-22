import {App, initializeApp, cert} from "firebase-admin/app"
const serviceAccount = require("../../firebase.json")

let firebaseApp : App | null = null

export function initializeFirebase() {
  try {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    })
  } catch (error) {
    throw error
  }
}