import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GameProvider } from './src/context/GameContext';
import { UserProvider, useUser } from './src/context/UserContext';
import LoginScreen from './src/screens/LoginScreen';
import ClubsScreen from './src/screens/ClubsScreen';
import MatchmakingScreen from './src/screens/MatchmakingScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#0f3460', paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#a0a0a0',
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen name="Play" component={ClubsScreen} options={{ tabBarIcon: ({ color, size }: any) => (<Text style={{ fontSize: size, color }}>🎮</Text>) }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarIcon: ({ color, size }: any) => (<Text style={{ fontSize: size, color }}>🏆</Text>) }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ tabBarIcon: ({ color, size }: any) => (<Text style={{ fontSize: size, color }}>💰</Text>) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }: any) => (<Text style={{ fontSize: size, color }}>👤</Text>) }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, setUser } = useUser();

  if (!user) {
    return <LoginScreen onLogin={(u: any) => setUser(u)} />;
  }

  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
