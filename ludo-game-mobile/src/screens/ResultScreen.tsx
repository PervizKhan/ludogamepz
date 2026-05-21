import React, { useEffect } from 'react';
import { playWin, playLose } from "../utils/sounds";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/UserContext';
import { RootStackParamList } from '../navigation/types';

export default function ResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Result'>>();
  const { gameState, resetGame } = useGame();
  const { refreshBalance } = useUser();

  const isWinner = gameState.winner === 'You';
  const isDraw = gameState.winner === 'Draw';
  useEffect(() => { if (isWinner) playWin(); else playLose(); }, []);

  useEffect(() => {
    refreshBalance();
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    navigation.navigate('Main');
  };

  const handleRematch = () => {
    resetGame();
    navigation.navigate('Matchmaking', { club: { id: gameState.clubId || 1, bet_amount: gameState.betAmount } });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>
          {isWinner ? '🏆' : isDraw ? '🤝' : '😔'}
        </Text>
        <Text style={[styles.resultTitle, isWinner ? styles.winText : isDraw ? styles.drawText : styles.loseText]}>
          {isWinner ? 'YOU WON!' : isDraw ? 'DRAW!' : 'YOU LOST'}
        </Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>
            {isWinner ? 'You Won' : isDraw ? 'Returned' : 'You Lost'}
          </Text>
          <Text style={[styles.amount, isWinner ? styles.winAmount : isDraw ? styles.drawAmount : styles.loseAmount]}>
            🪙 {isWinner ? gameState.betAmount * 2 : isDraw ? gameState.betAmount : gameState.betAmount}
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Match Summary</Text>

          <View style={styles.playerRow}>
            <View style={styles.playerSummary}>
              <Text style={styles.summaryEmoji}>😎</Text>
              <Text style={styles.summaryName}>You</Text>
              <Text style={styles.summaryScore}>{gameState.myTotal}</Text>
            </View>

            <Text style={styles.summaryVs}>VS</Text>

            <View style={styles.playerSummary}>
              <Text style={styles.summaryEmoji}>🤖</Text>
              <Text style={styles.summaryName}>{gameState.opponent}</Text>
              <Text style={styles.summaryScore}>{gameState.opponentTotal}</Text>
            </View>
          </View>

          <View style={styles.rollsDetail}>
            <View style={styles.rollColumn}>
              <Text style={styles.rollDetailTitle}>Your Rolls</Text>
              {gameState.myRolls.map((roll, i) => (
                <View key={i} style={styles.rollItem}>
                  <Text style={styles.rollNumber}>Roll {i + 1}: {roll}</Text>
                </View>
              ))}
            </View>

            <View style={styles.rollColumn}>
              <Text style={styles.rollDetailTitle}>{gameState.opponent}'s Rolls</Text>
              {gameState.opponentRolls.map((roll, i) => (
                <View key={i} style={styles.rollItem}>
                  <Text style={styles.rollNumber}>Roll {i + 1}: {roll}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.rematchButton} onPress={handleRematch}>
          <Text style={styles.rematchText}>🔄 Rematch (🪙 {gameState.betAmount})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
          <Text style={styles.playAgainText}>🎮 Choose Different Club</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.homeText}>🏠 Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', padding: 20 },
  resultCard: { backgroundColor: '#0f3460', borderRadius: 24, padding: 30, alignItems: 'center' },
  resultEmoji: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  winText: { color: '#00ff88' },
  loseText: { color: '#e94560' },
  drawText: { color: '#FFD700' },
  amountContainer: { alignItems: 'center', marginBottom: 25, backgroundColor: '#1a1a2e', padding: 20, borderRadius: 16, width: '100%' },
  amountLabel: { fontSize: 16, color: '#a0a0a0', marginBottom: 5 },
  amount: { fontSize: 36, fontWeight: 'bold' },
  winAmount: { color: '#00ff88' },
  loseAmount: { color: '#e94560' },
  drawAmount: { color: '#FFD700' },
  summaryContainer: { width: '100%', marginBottom: 25 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 15 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  playerSummary: { alignItems: 'center', flex: 1 },
  summaryEmoji: { fontSize: 40, marginBottom: 5 },
  summaryName: { color: '#fff', fontSize: 14, marginBottom: 5 },
  summaryScore: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  summaryVs: { color: '#e94560', fontSize: 20, fontWeight: 'bold', marginHorizontal: 20 },
  rollsDetail: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1a1a2e', padding: 15, borderRadius: 12 },
  rollColumn: { flex: 1, alignItems: 'center' },
  rollDetailTitle: { color: '#a0a0a0', fontSize: 12, marginBottom: 8 },
  rollItem: { marginVertical: 2 },
  rollNumber: { color: '#fff', fontSize: 14 },
  rematchButton: { backgroundColor: '#4ECDC4', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  rematchText: { color: '#1a1a2e', fontSize: 16, fontWeight: 'bold' },
  playAgainButton: { backgroundColor: '#e94560', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
  playAgainText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  homeButton: { backgroundColor: '#16213e', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  homeText: { color: '#a0a0a0', fontSize: 16 },
});
