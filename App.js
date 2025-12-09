import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Button, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  return (
    <View style={styles.appContainer}>
      <LinearGradient
        colors={['#10b981', '#0d9488']}
        style={styles.loginContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.appNameText}>שופ-סמארט</Text>
        <Text style={styles.appNameSubText}>רשימת קניות</Text>
        <TouchableOpacity style={styles.Button}>
          <View style={{flexDirection: 'row-reverse', alignItems: 'center',borderWidth: 1,padding:10, borderColor: '#6b7280', borderWidth: 1 }}>
          <Image style={{ width: 24, height: 24 }} source={require('./assets/googlelogo.png')} />
          <Text style={styles.ButtonText}>התחבר עם Google</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1
  },
  loginContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    
  },
  appNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    opacity: 0.9,
    margin: 1,
    color: '#fff',
    marginBottom: 10,
  },
   appNameSubText: {
    fontSize: 24,
    opacity: 0.9,
    margin: 1,
    color: '#fff',
    marginBottom: 40,
  },
  Button: {
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: '#6b7280',
    fontWeight: 'semi-bold',
    fontcolor: '#374151',
    hoverColor: '#f9fafb',
    paddingInline: 20,
    paddingBlock: 20,
    borderBlockColor: 'black',
    borderBlockWidth: 10,
    transitionDuration: '150ms',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },  ButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    margin: 10,
  },
});
