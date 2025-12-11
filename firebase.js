import { initializeApp } from "firebase/app";
import {
    initializeAuth,
    getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import * as AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBW8SVnMR0DE4OkHwoE8Lk81snayuTBy2E",
    authDomain: "gen-lang-client-0854447705.firebaseapp.com",
    projectId: "gen-lang-client-0854447705",
    storageBucket: "gen-lang-client-0854447705.firebasestorage.app",
    messagingSenderId: "861915527720",
    appId: "1:861915527720:web:d382f5c27f1396de82931d",
    measurementId: "G-VECPP1CS9H"
};

export const WEB_CLIENT_ID = "861915527720-ton1d36rnobknje5f0vj1cish5kjn460.apps.googleusercontent.com";
export const ANDROID_CLIENT_ID = "861915527720-hik9e36pa63krr8drijamemg9dc0qoos.apps.googleusercontent.com";
const app = initializeApp(firebaseConfig);


export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(
        // מעבירים את המחלקה (או אובייקט הייבוא) של AsyncStorage
        AsyncStorage.default || AsyncStorage
    ),
});
export const db = getFirestore(app);

