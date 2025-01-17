import { getApp } from "@react-native-firebase/app";
import firebaseAuth from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";

const app = getApp();
export const db = getFirestore(app);
export const auth = firebaseAuth(app);
