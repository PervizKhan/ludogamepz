import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, wsManager } from '../api/client';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/UserContext';
import { playMatchFound } from '../utils/sounds';
import { RootStackParamList } from '../navigation/types';

export default function MatchmakingScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Matchmaking'>>();
  const { setGameState } = useGame();
  const { user } = useUser();
  const { club } = route.params as { club: any };

  const userId = user?.id || 1;
  const username = user?.username || 'Player';

  const [dots, setDots] = useState('');
  const [timer, setTimer] = useState(0);
  const [foundOpponent, setFoundOpponent] = useState(false);
  const [opponentName, setOpponentName] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
      setTimer(prev => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    wsManager.connect();
    wsManager.emit('join-matchmaking', { userId, clubId: club.id });

    wsManager.on('match-found', (data: any) => {
      setOpponentName(data.opponent);
      setFoundOpponent(true);
      playMatchFound();

      setGameState({
        gameId: data.game.id,
        player: data.game.player_a_name === username ? 'A' : 'B',
        opponent: data.opponent,
        isBot: data.isBot,
        myRolls: [],
        opponentRolls: [],
        myTotal: 0,
        opponentTotal: 0,
        currentTurn: data.game?.current_turn || data.currentTurn || 'A',
        clubId: club.id,
        status: 'playing',
        winner: null,
        betAmount: club.bet_amount,
      });

      setTimeout(() => navigation.navigate('Game'), 2000);
    });

    return () => {
      wsManager.emit('leave-matchmaking', { userId, clubId: club.id });
    };
  }, []);

  useEffect(() => {
    const findMatch = async () => {
      try {
        const result = await api.joinMatchmaking(userId, username, club.id, club.bet_amount);

        if (result.success) {
          setOpponentName(result.opponent);
          setFoundOpponent(true);
          playMatchFound();

          setGameState({
            gameId: result.game.id,
            player: result.game.player_a_name === username ? 'A' : 'B',
            opponent: result.opponent,
            isBot: result.isBot,
            myRolls: [],
            opponentRolls: [],
            myTotal: 0,
            opponentTotal: 0,
            currentTurn: result.currentTurn || result.game?.current_turn || 'A',
            clubId: club.id,
            status: 'playing',
            winner: null,
            betAmount: club.bet_amount,
          });

          setTimeout(() => navigation.navigate('Game'), 2000);
        }
      } catch (error) {
        console.error('Matchmaking failed:', error);
      }
    };

    findMatch();
  }, []);

  return (
    <View style={styles.container}>
      {!foundOpponent ? (
        <>
          <Text style={styles.title}>Finding Opponent{dots}</Text>
          <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
          <Text style={styles.timer}>{timer}s</Text>
          <Text style={styles.clubInfo}>{club.name} • {club.bet_amount} 🪙</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Opponent Found!</Text>
          <Text style={styles.opponentName}>{opponentName}</Text>
          <Text style={styles.startingText}>Starting Game...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  timer: { fontSize: 16, color: '#a0a0a0', marginTop: 10 },
  clubInfo: { fontSize: 14, color: '#4ECDC4', marginTop: 20 },
  opponentName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 20 },
  startingText: { fontSize: 16, color: '#a0a0a0', marginTop: 10 },
});
