import React, {
  useContext,
  useEffect,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  GoogleAuthProvider,
  signInWithCredential, // הפונקציה שבה נשתמש
  User, // סוג הטיפוס של משתמש Firebase
} from "firebase/auth";
import {
  auth,
  WEB_CLIENT_ID,
  ANDROID_CLIENT_ID,
} from "../firebase";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { UserContext } from "../context/UserContext";
WebBrowser.maybeCompleteAuthSession();
import { LinearGradient } from "expo-linear-gradient";

export default function Login() {
  const {
    lang,
    setLang,
    setUser,
    isAuthLoading,
    t,
  } = useContext(UserContext);

  const [request, response, promptAsync] =
    Google.useAuthRequest({
      // נדרש: ה-Client ID של אפליקציית ה-Web שיצרתם ב-Google Cloud Console
      webClientId: WEB_CLIENT_ID,
      // אפשרות: הוסף את ה-Client ID של iOS/Android אם אתה בונה גרסה עצמאית (Standalone)
      // iosClientId: 'YOUR_IOS_CLIENT_ID',
      androidClientId: ANDROID_CLIENT_ID,
    });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      // יצירת אובייקט Credential של Firebase מה-Token
      const credential =
        GoogleAuthProvider.credential(id_token);

      // התחברות ל-Firebase באמצעות Credential
      signInWithCredential(auth, credential)
        .then((result) => {
          const firebaseUser: User = result.user; // הגדרת טיפוס ל-TS
          setUser(firebaseUser);
          console.log(
            "Logged in UID:",
            firebaseUser.uid
          );
        })
        .catch((error) => {
          console.error(
            "Firebase Auth Error:",
            error
          );
          let errorMessage =
            t.login_error_general;
          console.log(`Error: ${errorMessage}`);
          setUser(null);
        });
    } else if (response?.type === "dismiss") {
      console.log("Login dismissed by user.");
      // כאן ניתן לטפל כאשר המשתמש סוגר את חלון האימות
    }
  }, [response]);

  if (isAuthLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleFirebaseLogin = () => {
    // קורא לפונקציית promptAsync של Expo לפתיחת חלון האימות
    promptAsync();
  };

  return (
    <LinearGradient
      colors={["#10b981", "#0d9488"]}
      style={styles.loginContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.appNameText}>
        שופ-סמארט
      </Text>
      <Text style={styles.appNameSubText}>
        רשימת קניות
      </Text>
      <TouchableOpacity
        style={styles.Button}
        onPress={handleFirebaseLogin}
      >
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            borderWidth: 1,
            padding: 10,
            borderColor: "#6b7280",
          }}
        >
          <Image
            style={{
              width: 24,
              height: 24,
            }}
            source={require("../assets/googlelogo.png")}
          />
          <Text style={styles.ButtonText}>
            התחבר עם Google
          </Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  appNameText: {
    fontSize: 32,
    fontWeight: "bold",
    opacity: 0.9,
    margin: 1,
    color: "#fff",
    marginBottom: 10,
  },
  appNameSubText: {
    fontSize: 24,
    opacity: 0.9,
    margin: 1,
    color: "#fff",
    marginBottom: 40,
  },
  Button: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderColor: "#6b7280",
    fontWeight: "semibold",
    color: "#374151",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  ButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    margin: 10,
  },
});
