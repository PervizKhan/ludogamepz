import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import WalletScreen from './screens/WalletScreen';
import AdminScreen from './screens/AdminScreen';
import { Platform } from 'react-native';

const Stack = createNativeStackNavigator();
const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api'
  : 'http://192.168.59.156:3000/api';

// Reusable logout button component
function LogoutButton({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handleLogout}
      style={{ marginRight: 8, padding: 8 }}
    >
      <Text style={{ color: '#FF6B6B', fontWeight: '700', fontSize: 14 }}>Logout</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: '#16213e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#1a1a2e' },
          headerRight: (props) => {
            // Show logout on all screens except Login
            const routeName = props.tintColor ? 'not-login' : 'login';
            return null; // We'll set this per-screen
          }
        }}
      >
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {props => <LoginScreen {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Home" 
          options={({ navigation }) => ({
            headerShown: false,
          })}
        >
          {props => <HomeScreen {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Game" 
          options={({ navigation }) => ({
            title: 'Game',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        >
          {props => <GameScreen {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Wallet" 
          options={({ navigation }) => ({
            title: 'Wallet',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        >
          {props => <WalletScreen {...props} apiUrl={API_URL} />}
        </Stack.Screen>
        
        <Stack.Screen 
          name="Admin" 
          options={({ navigation }) => ({
            title: 'Admin Panel',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        >
          {props => <AdminScreen {...props} apiUrl={API_URL} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}