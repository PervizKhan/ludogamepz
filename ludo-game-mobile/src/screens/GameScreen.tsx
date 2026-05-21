import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playDiceRoll, playWin, playLose, playTick } from "../utils/sounds";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame } from '../context/GameContext';
import { api, wsManager } from '../api/client';
import { RootStackParamList } from '../navigation/types';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const TURN_TIME = 10;

export default function GameScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Game'>>();
  const { gameState, setGameState } = useGame();

  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [opponentRolling, setOpponentRolling] = useState(false);
  const [turnTimer, setTurnTimer] = useState(TURN_TIME);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMyTurn = gameState.currentTurn === gameState.player;
  const myRollsCount = gameState.myRolls.length;
  const opponentRollsCount = gameState.opponentRolls.length;
  const gameOver = gameState.status === 'completed';

  const rollDice = useCallback(async () => {
    const gs = gameStateRef.current;
    if (rolling || gs.currentTurn !== gs.player || gs.status !== 'playing') return;

    setRolling(true);
    shake();
    Vibration.vibrate(200); playDiceRoll();
    setTurnTimer(TURN_TIME);

    let rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      const result = await api.rollDice(gs.gameId!, gs.player!);
      clearInterval(rollInterval);

      if (result.success) {
        setDiceValue(result.yourRoll);
        pulse();
        setGameState(prev => ({
          ...prev,
          myRolls: [...prev.myRolls, result.yourRoll],
          myTotal: result.yourTotal,
          currentTurn: result.game?.current_turn || 'B',
        }));
      }
    } catch (error) {
      clearInterval(rollInterval);
    } finally {
      setRolling(false);
    }
  }, [rolling]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const gs = gameStateRef.current;
      if (gs.currentTurn === gs.player && gs.status === 'playing') {
        setTurnTimer(prev => {
          if (prev <= 1) {
            rollDice();
            return TURN_TIME;
          }
          return prev - 1;
        });
      } else {
        setTurnTimer(TURN_TIME);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const pollGameState = async () => {
    const gs = gameStateRef.current;
    if (!gs.gameId || gs.status === 'completed') return;
    try {
      const result = await api.getGameStatus(gs.gameId);
      if (result.success || result.game) {
        const game = result.game || result;
        const isPlayerA = gs.player === 'A';
        const newMyRolls = isPlayerA ? (game.player_a_rolls || []) : (game.player_b_rolls || []);
        const newOpponentRolls = isPlayerA ? (game.player_b_rolls || []) : (game.player_a_rolls || []);
        if (newOpponentRolls.length > gs.opponentRolls.length) {
          setOpponentRolling(true);
          setTimeout(() => setOpponentRolling(false), 800);
        }
        const myTotal = isPlayerA ? (game.player_a_total || 0) : (game.player_b_total || 0);
        const opponentTotal = isPlayerA ? (game.player_b_total || 0) : (game.player_a_total || 0);
        setGameState(prev => ({
          ...prev, myRolls: newMyRolls, opponentRolls: newOpponentRolls, myTotal, opponentTotal,
          currentTurn: game.current_turn || (newMyRolls.length <= newOpponentRolls.length ? 'A' : 'B'),
          status: game.status,
          winner: game.status === 'completed' ? (myTotal > opponentTotal ? 'You' : myTotal < opponentTotal ? 'Opponent' : 'Draw') : null,
        }));
        if (game.status === 'completed') setTimeout(() => navigation.navigate('Result'), 1000);
      }
    } catch (e) {}
  };

  useEffect(() => {
    wsManager.connect();
    const gs = gameStateRef.current;
    if (gs.gameId) wsManager.joinGame(gs.gameId);

    wsManager.on('game-update', (data: any) => {
      const gs = gameStateRef.current;
      if (data.gameId !== gs.gameId) return;
      const isPlayerA = gs.player === 'A';
      if (data.player !== gs.player) { setOpponentRolling(true); setTimeout(() => setOpponentRolling(false), 800); }
      const myTotal = isPlayerA ? (data.playerATotal || 0) : (data.playerBTotal || 0);
      const opponentTotal = isPlayerA ? (data.playerBTotal || 0) : (data.playerATotal || 0);
      setGameState(prev => ({
        ...prev, myRolls: isPlayerA ? (data.playerARolls || []) : (data.playerBRolls || []),
        opponentRolls: isPlayerA ? (data.playerBRolls || []) : (data.playerARolls || []),
        myTotal, opponentTotal, currentTurn: data.currentTurn, status: data.status,
        winner: data.status === 'completed' ? (myTotal > opponentTotal ? 'You' : myTotal < opponentTotal ? 'Opponent' : 'Draw') : null,
      }));
      if (data.status === 'completed') setTimeout(() => navigation.navigate('Result'), 1000);
    });

    const pollInterval = setInterval(pollGameState, 2000);
    return () => { clearInterval(pollInterval); if (gs.gameId) wsManager.leaveGame(gs.gameId); };
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const getOpponentDice = () => {
    if (opponentRolling) return '❓';
    if (gameState.opponentRolls.length > 0) return DICE_FACES[gameState.opponentRolls[gameState.opponentRolls.length - 1] - 1];
    return '🎲';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.betText}>Bet: 🪙 {gameState.betAmount}</Text>
        <Text style={styles.roundText}>Round {Math.min(myRollsCount + opponentRollsCount + 1, 6)}/6</Text>
      </View>

      <View style={styles.connectionBar}>
        <View style={styles.connectionDot} />
        <Text style={styles.connectionText}>Live</Text>
      </View>

      <View style={styles.playersContainer}>
        <View style={[styles.playerCard, isMyTurn && styles.activePlayer]}>
          <Text style={styles.playerEmoji}>😎</Text>
          <Text style={styles.playerName}>You</Text>
          <Text style={styles.playerScore}>{gameState.myTotal}</Text>
          <View style={styles.rollsContainer}>
            {gameState.myRolls.map((roll, i) => (
              <Text key={i} style={styles.rollHistory}>{DICE_FACES[roll - 1]}</Text>
            ))}
          </View>
          {isMyTurn && <View style={styles.turnIndicator}><Text>👆</Text></View>}
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          {opponentRolling && (
            <View style={styles.opponentRollingBadge}>
              <Text style={styles.opponentRollingText}>Rolling...</Text>
            </View>
          )}
        </View>

        <View style={[styles.playerCard, !isMyTurn && gameState.status === 'playing' && styles.activePlayer]}>
          <Text style={styles.playerEmoji}>🤖</Text>
          <Text style={styles.playerName}>{gameState.opponent}</Text>
          <Text style={styles.playerScore}>{gameState.opponentTotal}</Text>
          <View style={styles.rollsContainer}>
            {gameState.opponentRolls.map((roll, i) => (
              <Text key={i} style={styles.rollHistory}>{DICE_FACES[roll - 1]}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Timer Bar */}
      {isMyTurn && !gameOver && (
        <View style={styles.timerContainer}>
          <View style={styles.timerBarBg}>
            <View style={[styles.timerBarFill, { width: `${(turnTimer / TURN_TIME) * 100}%`, backgroundColor: turnTimer <= 3 ? '#e94560' : '#FFD700' }]} />
          </View>
          <Text style={[styles.timerText, { color: turnTimer <= 3 ? '#e94560' : '#FFD700' }]}>
            ⏱️ {turnTimer}s
          </Text>
        </View>
      )}

      <Text style={[styles.turnText, opponentRolling && { color: '#e94560' }]}>
        {gameOver ? 'Game Over!' : opponentRolling ? `🎲 ${gameState.opponent} rolling...` : isMyTurn ? '🎲 Your Turn!' : `⏳ Waiting for ${gameState.opponent}...`}
      </Text>

      <View style={styles.diceArea}>
        <Animated.View style={[styles.diceContainer, { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }]}>
          <Text style={styles.dice}>{DICE_FACES[diceValue - 1]}</Text>
          <Text style={styles.diceNumber}>{diceValue}</Text>
        </Animated.View>
        {gameState.opponentRolls.length > 0 && (
          <View style={styles.opponentLastRoll}>
            <Text style={styles.opponentLastRollLabel}>{gameState.opponent} rolled:</Text>
            <Text style={styles.opponentLastRollValue}>{getOpponentDice()}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.rollButton, (!isMyTurn || rolling || gameOver) && styles.rollButtonDisabled]}
        onPress={rollDice}
        disabled={!isMyTurn || rolling || gameOver}
      >
        <Text style={styles.rollButtonText}>
          {gameOver ? '🏆 Game Over' : rolling ? '🎲 Rolling...' : '🎲 ROLL DICE'}
        </Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Your rolls: {myRollsCount}/3 | Opponent: {opponentRollsCount}/3</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((myRollsCount + opponentRollsCount) / 6) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50, marginBottom: 10 },
  betText: { fontSize: 18, color: '#FFD700', fontWeight: 'bold' },
  roundText: { fontSize: 16, color: '#a0a0a0' },
  connectionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, backgroundColor: '#0f3460', padding: 8, borderRadius: 20, alignSelf: 'center' },
  connectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', marginRight: 6 },
  connectionText: { color: '#00ff88', fontSize: 12, fontWeight: 'bold' },
  playersContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  playerCard: { backgroundColor: '#0f3460', borderRadius: 16, padding: 15, alignItems: 'center', width: '40%', borderWidth: 2, borderColor: 'transparent' },
  activePlayer: { borderColor: '#FFD700', elevation: 10 },
  playerEmoji: { fontSize: 35, marginBottom: 5 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  playerScore: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  rollsContainer: { flexDirection: 'row', marginTop: 8, gap: 5 },
  rollHistory: { fontSize: 18 },
  turnIndicator: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFD700', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  vsContainer: { alignItems: 'center' },
  vsText: { fontSize: 22, fontWeight: 'bold', color: '#e94560' },
  opponentRollingBadge: { backgroundColor: '#e94560', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginTop: 5 },
  opponentRollingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  // Timer
  timerContainer: { alignItems: 'center', marginBottom: 10 },
  timerBarBg: { width: '80%', height: 6, backgroundColor: '#0f3460', borderRadius: 3, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 3 },
  timerText: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  turnText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  diceArea: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 10 },
  diceContainer: { alignItems: 'center' },
  dice: { fontSize: 80 },
  diceNumber: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginTop: 5 },
  opponentLastRoll: { alignItems: 'center', backgroundColor: '#0f3460', padding: 15, borderRadius: 12 },
  opponentLastRollLabel: { color: '#a0a0a0', fontSize: 12, marginBottom: 5 },
  opponentLastRollValue: { fontSize: 40 },
  rollButton: { backgroundColor: '#e94560', padding: 18, borderRadius: 16, alignItems: 'center', marginHorizontal: 40, elevation: 8 },
  rollButtonDisabled: { backgroundColor: '#4a4a6a' },
  rollButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  progressContainer: { marginTop: 20 },
  progressText: { color: '#a0a0a0', textAlign: 'center', marginBottom: 10 },
  progressBar: { height: 8, backgroundColor: '#0f3460', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
});
