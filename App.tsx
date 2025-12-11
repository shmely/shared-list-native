import { StyleSheet, View } from "react-native";
import { UserProvider } from "./context/UserContext";
import { ShopSmartProvider } from "./context/ShopSmartContext/ShopSmartContext";
import Login from "./components/Login";

export default function App() {
  return (
    <ShopSmartProvider>
      <UserProvider>
        <View style={styles.appContainer}>
          <Login />
        </View>
      </UserProvider>
    </ShopSmartProvider>
  );
}
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});
