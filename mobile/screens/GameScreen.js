import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const MIN_BET = 10;
const MAX_BET = 500;
const TURN_TIMEOUT = 10;
const TOTAL_ROUNDS = 3;

function CircularTimer({ seconds, total }) {
  const size = 50;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = seconds / total;
  const strokeDashoffset = circumference * (1 - progress);
  const color = seconds <= 3 ? '#FF6B6B' : '#4ECDC4';

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle stroke="#0f3460" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={color} fill="none" cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth} strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ color, fontWeight: '800', fontSize: 14, marginTop: -32 }}>{seconds}</Text>
    </View>
  );
}

export default function GameScreen({ navigation, route, apiUrl }) {
  const { game, user } = route.params;
  const [gameState, setGameState] = useState(null);
  const [myBet, setMyBet] = useState('50');
  const [counterBet, setCounterBet] = useState('');
  const [myBalance, setMyBalance] = useState(user.balance);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [timer, setTimer] = useState(TURN_TIMEOUT);
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Only poll when needed
  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      fetchGameState();
      if (mode === null || mode === 'waiting') fetchAvailableGames();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchGameState();
    fetchAvailableGames();
    startPolling();
    return () => stopPolling();
  }, []);

  // Stop polling when game is finished
  useEffect(() => {
    if (mode === 'finished') stopPolling();
  }, [mode]);

  useEffect(() => {
    if (mode === 'playing' && gameState?.isMyTurn && gameState?.turnStartedAt) {
      const elapsed = Math.floor((Date.now() - gameState.turnStartedAt) / 1000);
      const remaining = Math.max(0, TURN_TIMEOUT - elapsed);
      setTimer(remaining);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); fetchGameState(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setTimer(TURN_TIMEOUT);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [mode, gameState?.isMyTurn, gameState?.turnStartedAt]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const fetchAvailableGames = async () => {
    try {
      const res = await fetch(`${apiUrl}/game/1v1?action=list`);
      const data = await res.json();
      if (data.success) setAvailableGames((data.games || []).filter(g => g.creatorName !== user.name));
    } catch (e) {}
  };

  const fetchGameState = async () => {
    try {
      const res = await fetch(`${apiUrl}/game/1v1?action=state&playerId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setGameState(data.game);
        setMyBalance(data.playerBalance);
        if (!data.game) {
          // Player not in any game
          if (mode !== null) {
            setMode(null);
            setMyBet('50');
            startPolling();
          }
          return;
        }
        if (data.game?.status === 'negotiating') setMode('negotiating');
        if (data.game?.status === 'playing') setMode('playing');
        if (data.game?.status === 'finished') setMode('finished');
        if (data.message) showToast(data.message);
      }
    } catch (e) {}
  };

  const createGame = async () => {
    const betAmount = parseInt(myBet) || 50;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/game/1v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, action: 'create', amount: betAmount })
      });
      const data = await res.json();
      if (data.success) { setMode('waiting'); showToast(`Game created! Bet: Rs ${betAmount}`); }
      else showToast(data.message);
    } catch (e) { showToast('Connection failed'); }
    setLoading(false);
  };

  const joinGame = async (gameId) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/game/1v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, action: 'join', gameId })
      });
      const data = await res.json();
      if (data.success) fetchGameState();
      else showToast(data.message);
    } catch (e) { showToast('Connection failed'); }
    setLoading(false);
  };

  const acceptBet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/game/1v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, action: 'accept' })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); fetchGameState(); }
      else showToast(data.message);
    } catch (e) { showToast('Connection failed'); }
    setLoading(false);
  };

  const counterOffer = async () => {
    const newBet = parseInt(counterBet);
    if (!newBet || newBet < MIN_BET || newBet > MAX_BET) return showToast(`Bet must be Rs ${MIN_BET}-${MAX_BET}`);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/game/1v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, action: 'counter', amount: newBet })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); setCounterBet(''); fetchGameState(); }
      else showToast(data.message);
    } catch (e) { showToast('Connection failed'); }
    setLoading(false);
  };

  const rollDice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/game/1v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: user.id, action: 'roll' })
      });
      const data = await res.json();
      if (data.success) {
        setGameState(data.game);
        setMyBalance(data.newBalance || myBalance);
        showToast(data.message);
        if (timerRef.current) clearInterval(timerRef.current);
      } else showToast(data.message);
    } catch (e) { showToast('Connection failed'); }
    setLoading(false);
  };

  const playAgain = () => {
    stopPolling();
    setMode(null);
    setMyBet('50');
    setCounterBet('');
    setGameState(null);
    if (timerRef.current) clearInterval(timerRef.current);
    // Small delay then start polling again
    setTimeout(() => startPolling(), 500);
  };

  const handleLogout = () => {
    stopPolling();
    if (timerRef.current) clearInterval(timerRef.current);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // ====== MODE SELECTION ======
  if (!mode) {
    return (
      <View style={styles.container}>
        {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMsg}</Text></View>}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.gameTitle}>{game.emoji} {game.name}</Text>
          <Text style={styles.balanceText}>Balance: Rs {myBalance}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Your Bet Amount</Text>
          <TextInput style={styles.betInput} value={myBet} onChangeText={(t) => setMyBet(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
          <View style={styles.quickRow}>
            {[10, 50, 100, 200].map((amt) => (
              <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => setMyBet(amt.toString())}>
                <Text style={styles.quickBtnText}>Rs {amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={createGame} disabled={loading}>
          <Text style={styles.createBtnText}>🎯 Create Game (Rs {myBet || 50})</Text>
        </TouchableOpacity>
        <Text style={styles.orText}>— or join existing —</Text>
        <Text style={styles.sectionTitle}>Open Games ({availableGames.length})</Text>
        {availableGames.length === 0 ? (
          <Text style={styles.noGames}>No open games. Create one!</Text>
        ) : (
          availableGames.map((g) => (
            <TouchableOpacity key={g.id} style={styles.joinCard} onPress={() => joinGame(g.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.joinName}>🎮 {g.creatorName}</Text>
                <Text style={styles.joinSub}>Bet: Rs {g.bet}</Text>
              </View>
              <View style={styles.joinBtnBox}><Text style={styles.joinBtnText}>JOIN</Text></View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  }

  // ====== WAITING ======
  if (mode === 'waiting') {
    return (
      <View style={styles.container}>
        {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMsg}</Text></View>}
        <Text style={styles.waitingEmoji}>⏳</Text>
        <Text style={styles.waitingTitle}>Waiting for Opponent</Text>
        <Text style={styles.waitingSub}>Bet: Rs {myBet}</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={playAgain}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
      </View>
    );
  }

  // ====== NEGOTIATING ======
  if (mode === 'negotiating') {
    const isCreator = user.id === gameState?.player1?.id;
    const proposerIsCreator = gameState?.betProposer === 'creator';
    const iProposed = (isCreator && proposerIsCreator) || (!isCreator && !proposerIsCreator);
    const opponentName = gameState?.opponentName || 'Opponent';

    return (
      <View style={styles.container}>
        {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMsg}</Text></View>}
        <View style={styles.header}>
          <Text style={styles.heading}>Bet Negotiation</Text>
          <Text style={styles.balanceText}>Balance: Rs {myBalance}</Text>
        </View>
        <View style={styles.negotiateCard}>
          {iProposed ? (
            <>
              <Text style={styles.negotiateTitle}>You proposed Rs {gameState?.bet}</Text>
              <Text style={styles.waitingSub}>Waiting for {opponentName}...</Text>
            </>
          ) : (
            <>
              <Text style={styles.negotiateTitle}>{opponentName} proposes:</Text>
              <Text style={styles.proposedBet}>Rs {gameState?.bet}</Text>
              <View style={styles.negotiateActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={acceptBet} disabled={loading}>
                  <Text style={styles.acceptBtnText}>✓ Accept Rs {gameState?.bet}</Text>
                </TouchableOpacity>
                <Text style={styles.orText}>— or counter —</Text>
                <View style={styles.counterRow}>
                  <TextInput style={styles.counterInput} placeholder="Amount" placeholderTextColor="#666" value={counterBet} onChangeText={(t) => setCounterBet(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" maxLength={4} />
                  <TouchableOpacity style={styles.counterBtn} onPress={counterOffer} disabled={loading}>
                    <Text style={styles.counterBtnText}>Counter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  // ====== PLAYING ======
  if (mode === 'playing') {
    const myRolls = gameState?.myRolls || [];
    const oppRolls = gameState?.oppRolls || [];
    const myTotal = gameState?.myTotal || 0;
    const oppTotal = gameState?.oppTotal || 0;
    const isMyTurn = gameState?.isMyTurn;
    const currentTurn = gameState?.currentTurn || 1;
    const totalTurns = gameState?.totalTurns || 6;
    const lastMyRoll = myRolls.length > 0 ? myRolls[myRolls.length - 1] : null;
    const lastOppRoll = oppRolls.length > 0 ? oppRolls[oppRolls.length - 1] : null;

    // Build turn-by-turn history
    const turnHistory = [];
    for (let i = 0; i < Math.max(myRolls.length, oppRolls.length); i++) {
      turnHistory.push({
        turn: i + 1,
        myRoll: myRolls[i] !== undefined ? myRolls[i] : null,
        oppRoll: oppRolls[i] !== undefined ? oppRolls[i] : null,
      });
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1, paddingBottom: 20 }}>
        {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMsg}</Text></View>}
        
        <View style={styles.header}>
          <Text style={styles.heading}>⚔️ Turn {currentTurn}/{totalTurns}</Text>
          <Text style={styles.balanceText}>Balance: Rs {myBalance}</Text>
        </View>

        {/* Running Totals */}
        <View style={styles.scoreboard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>You</Text>
            <Text style={styles.scoreValue}>{myTotal}</Text>
          </View>
          <Text style={styles.scoreVs}>-</Text>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>{gameState?.opponentName || 'Opp'}</Text>
            <Text style={styles.scoreValue}>{oppTotal}</Text>
          </View>
        </View>

        {/* Roll History */}
        {turnHistory.length > 0 && (
          <View style={styles.rollHistoryScroll}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.rollHistoryRow}>
                {turnHistory.map((t, i) => (
                  <View key={i} style={styles.rollHistoryCard}>
                    <Text style={styles.rollHistoryTurn}>#{t.turn}</Text>
                    <View style={styles.rollHistoryDice}>
                      <Text style={[styles.rollHistoryDiceText, styles.rollHistoryYou]}>
                        {t.myRoll !== null ? t.myRoll : '-'}
                      </Text>
                      <Text style={styles.rollHistorySep}>|</Text>
                      <Text style={[styles.rollHistoryDiceText, styles.rollHistoryOpp]}>
                        {t.oppRoll !== null ? t.oppRoll : '-'}
                      </Text>
                    </View>
                  </View>
                ))}
                {/* Empty slots for remaining turns */}
                {Array.from({ length: totalTurns - turnHistory.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={[styles.rollHistoryCard, styles.rollHistoryEmpty]}>
                    <Text style={styles.rollHistoryTurn}>#{turnHistory.length + i + 1}</Text>
                    <Text style={styles.rollHistoryPending}>?</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.potCard}>
          <Text style={styles.potLabel}>POT</Text>
          <Text style={styles.potAmount}>Rs {gameState?.pot || 0}</Text>
        </View>

        {isMyTurn && <View style={styles.timerSection}><CircularTimer seconds={timer} total={TURN_TIMEOUT} /><Text style={styles.timerLabel}>Your turn!</Text></View>}
        {!isMyTurn && <Text style={styles.waitingTurn}>Waiting for {gameState?.opponentName} to roll...</Text>}

        <View style={styles.duelRow}>
          <View style={styles.duelPlayer}>
            <Text style={styles.duelLabel}>YOU</Text>
            <View style={[styles.diceBox, lastMyRoll !== null && styles.diceBoxRolled]}>
              <Text style={styles.diceText}>{lastMyRoll !== null ? lastMyRoll : '?'}</Text>
            </View>
            <Text style={styles.duelName}>{user.name}</Text>
            <Text style={styles.duelTotal}>Total: {myTotal}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.duelPlayer}>
            <Text style={styles.duelLabel}>OPP</Text>
            <View style={[styles.diceBox, lastOppRoll !== null && styles.diceBoxOppRolled]}>
              <Text style={styles.diceText}>{lastOppRoll !== null ? lastOppRoll : '?'}</Text>
            </View>
            <Text style={styles.duelName}>{gameState?.opponentName || '???'}</Text>
            <Text style={styles.duelTotal}>Total: {oppTotal}</Text>
          </View>
        </View>

        {isMyTurn && (
          <TouchableOpacity style={styles.rollBtn} onPress={rollDice} disabled={loading}>
            <Text style={styles.rollBtnText}>{loading ? '🎲...' : `🎲 ROLL! (${myRolls.length + 1}/${totalTurns/2})`}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }


   // ====== FINISHED ======
  if (mode === 'finished') {
    const won = gameState?.winner === user.id;
    const tie = gameState?.winner === 0;
    const myRolls = gameState?.myRolls || [];
    const oppRolls = gameState?.oppRolls || [];
    const myTotal = gameState?.myTotal || 0;
    const oppTotal = gameState?.oppTotal || 0;

    // Build complete turn history
    const turnHistory = [];
    for (let i = 0; i < Math.max(myRolls.length, oppRolls.length); i++) {
      turnHistory.push({
        turn: i + 1,
        myRoll: myRolls[i] !== undefined ? myRolls[i] : '-',
        oppRoll: oppRolls[i] !== undefined ? oppRolls[i] : '-',
      });
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ justifyContent: 'center', flexGrow: 1, paddingBottom: 20 }}>
        {toastVisible && <View style={styles.toast}><Text style={styles.toastText}>{toastMsg}</Text></View>}
        
        <Text style={styles.resultEmoji}>{won ? '🏆' : tie ? '🤝' : '😞'}</Text>
        <Text style={[styles.resultTitle, { color: won ? '#ffd200' : tie ? '#4ECDC4' : '#FF6B6B' }]}>
          {won ? 'YOU WIN!' : tie ? 'TIE!' : 'YOU LOSE!'}
        </Text>

        {/* Final Totals */}
        <View style={styles.finalScoreCard}>
          <View style={styles.finalScoreRow}>
            <View style={styles.finalPlayer}>
              <Text style={styles.finalPlayerName}>{user.name} (You)</Text>
              <Text style={styles.finalPlayerTotal}>{myTotal}</Text>
            </View>
            <Text style={styles.finalVs}>VS</Text>
            <View style={styles.finalPlayer}>
              <Text style={styles.finalPlayerName}>{gameState?.opponentName}</Text>
              <Text style={styles.finalPlayerTotal}>{oppTotal}</Text>
            </View>
          </View>
        </View>

        {/* Complete Turn Summary */}
        <Text style={styles.summaryTitle}>Roll-by-Roll Summary</Text>
        {turnHistory.map((t, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.summaryRound}>Turn {t.turn}</Text>
            <View style={styles.summaryRolls}>
              <Text style={[styles.summaryDice, styles.summaryYou]}>{t.myRoll}</Text>
              <Text style={styles.summarySep}>-</Text>
              <Text style={[styles.summaryDice, styles.summaryOpp]}>{t.oppRoll}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.resultAmount, { color: won ? '#4ECDC4' : tie ? '#aaa' : '#FF6B6B' }]}>
          {won ? `+Rs ${gameState?.pot}` : tie ? 'Rs 0 (refunded)' : `-Rs ${gameState?.agreedBet || gameState?.bet}`}
        </Text>
        <Text style={styles.balanceText}>Balance: Rs {myBalance}</Text>

        <View style={{ gap: 8, marginTop: 16 }}>
          <TouchableOpacity style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>🔄 Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => { stopPolling(); navigation.goBack(); }}>
            <Text style={styles.homeBtnText}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 12 },
  toast: { position: 'absolute', top: 8, left: 16, right: 16, backgroundColor: '#ffd200', padding: 10, borderRadius: 10, zIndex: 100, alignItems: 'center' },
  toastText: { color: '#1a1a2e', fontWeight: '800', fontSize: 13 },
  logoutBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 8 },
  logoutIcon: { fontSize: 20 },
  header: { alignItems: 'center', marginBottom: 10 },
  gameTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heading: { color: '#fff', fontSize: 20, fontWeight: '800' },
  balanceText: { color: '#4ECDC4', fontSize: 15, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: '#16213e', borderRadius: 14, padding: 14, marginBottom: 12 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  betInput: { backgroundColor: '#0f3460', color: '#ffd200', padding: 12, borderRadius: 10, fontSize: 28, fontWeight: '800', textAlign: 'center', borderWidth: 2, borderColor: '#4ECDC4', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  quickBtn: { backgroundColor: '#0f3460', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 15 },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  createBtn: { backgroundColor: '#4ECDC4', padding: 14, borderRadius: 25, alignItems: 'center', marginBottom: 12 },
  createBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 16 },
  orText: { color: '#666', textAlign: 'center', marginVertical: 8, fontSize: 12 },
  sectionTitle: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  noGames: { color: '#666', textAlign: 'center', fontSize: 13 },
  joinCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  joinName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  joinSub: { color: '#888', fontSize: 12 },
  joinBtnBox: { backgroundColor: '#4ECDC4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  joinBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 13 },
  waitingEmoji: { fontSize: 60, textAlign: 'center' },
  waitingTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  waitingSub: { color: '#aaa', textAlign: 'center', marginTop: 8 },
  cancelBtn: { backgroundColor: '#e94560', padding: 12, borderRadius: 25, alignItems: 'center', marginTop: 20 },
  cancelBtnText: { color: '#fff', fontWeight: '700' },
  negotiateCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 20, alignItems: 'center' },
  negotiateTitle: { color: '#aaa', fontSize: 14, marginBottom: 8 },
  proposedBet: { color: '#ffd200', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  negotiateActions: { width: '100%' },
  acceptBtn: { backgroundColor: '#4ECDC4', padding: 14, borderRadius: 25, alignItems: 'center', marginBottom: 10 },
  acceptBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 16 },
  counterRow: { flexDirection: 'row', gap: 8 },
  counterInput: { flex: 1, backgroundColor: '#0f3460', color: '#fff', padding: 12, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#4ECDC4' },
  counterBtn: { backgroundColor: '#FFD93D', padding: 12, borderRadius: 25, paddingHorizontal: 20 },
  counterBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 14 },
  
  // Scoreboard
  scoreboard: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 8 },
  scoreItem: { alignItems: 'center' },
  scoreLabel: { color: '#aaa', fontSize: 11 },
  scoreValue: { color: '#ffd200', fontSize: 24, fontWeight: '800' },
  scoreVs: { color: '#666', fontSize: 18 },
  
  // Roll history horizontal scroll
  rollHistoryScroll: { marginBottom: 8 },
  rollHistoryRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 4 },
  rollHistoryCard: { backgroundColor: '#0f3460', borderRadius: 8, padding: 6, alignItems: 'center', minWidth: 45 },
  rollHistoryEmpty: { opacity: 0.4 },
  rollHistoryTurn: { color: '#aaa', fontSize: 9 },
  rollHistoryDice: { flexDirection: 'row', gap: 2, marginTop: 2 },
  rollHistoryDiceText: { fontSize: 14, fontWeight: '800' },
  rollHistoryYou: { color: '#4ECDC4' },
  rollHistoryOpp: { color: '#FF6B6B' },
  rollHistorySep: { color: '#666', fontSize: 12 },
  rollHistoryPending: { color: '#666', fontSize: 16 },

  potCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 10, alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: '#ffd200' },
  potLabel: { color: '#aaa', fontSize: 10, letterSpacing: 2 },
  potAmount: { color: '#ffd200', fontSize: 24, fontWeight: '800' },
  timerSection: { alignItems: 'center', marginBottom: 8 },
  timerLabel: { color: '#4ECDC4', fontWeight: '700', fontSize: 12, marginTop: 2 },
  waitingTurn: { color: '#888', textAlign: 'center', fontSize: 13, marginBottom: 8 },
  duelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 },
  duelPlayer: { alignItems: 'center', flex: 1 },
  duelLabel: { color: '#aaa', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  diceBox: { backgroundColor: '#16213e', borderRadius: 14, width: 60, height: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f3460' },
  diceBoxRolled: { borderColor: '#4ECDC4' },
  diceBoxOppRolled: { borderColor: '#FF6B6B' },
  diceText: { color: '#ffd200', fontSize: 28, fontWeight: '800' },
  duelName: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 },
  duelTotal: { color: '#aaa', fontSize: 11, marginTop: 2 },
  vsText: { color: '#e94560', fontSize: 18, fontWeight: '900' },
  rollBtn: { backgroundColor: '#ffd200', padding: 14, borderRadius: 25, alignItems: 'center', marginTop: 6 },
  rollBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 16 },
  
  // Result
  resultEmoji: { fontSize: 50, textAlign: 'center' },
  resultTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  finalScoreCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
  finalScoreText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  finalScoreRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  finalPlayer: { alignItems: 'center' },
  finalPlayerName: { color: '#aaa', fontSize: 12 },
  finalPlayerTotal: { color: '#ffd200', fontSize: 28, fontWeight: '800' },
  finalVs: { color: '#e94560', fontSize: 16, fontWeight: '900' },
  summaryTitle: { color: '#aaa', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6, textAlign: 'center' },
  summaryList: { gap: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16213e', borderRadius: 8, padding: 8, alignItems: 'center' },
  summaryRound: { color: '#aaa', fontSize: 12 },
  summaryRolls: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  summaryDice: { fontSize: 16, fontWeight: '800' },
  summaryYou: { color: '#4ECDC4' },
  summaryOpp: { color: '#FF6B6B' },
  summarySep: { color: '#666' },
  summaryScores: { color: '#fff', fontWeight: '700', fontSize: 14 },
  summaryWinner: { fontSize: 11, fontWeight: '700' },
  resultAmount: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  playAgainBtn: { backgroundColor: '#ffd200', padding: 14, borderRadius: 25, alignItems: 'center' },
  playAgainText: { color: '#1a1a2e', fontWeight: '800', fontSize: 16 },
  homeBtn: { backgroundColor: '#0f3460', padding: 14, borderRadius: 25, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
})};