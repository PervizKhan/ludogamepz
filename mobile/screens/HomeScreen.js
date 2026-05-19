import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const GAMES = [
  { id: 'dice', name: 'Dice Duel', emoji: '🎲', type: 'PvP', color: '#FF6B6B', desc: 'Roll dice, highest wins' },
  { id: 'higherlower', name: 'Higher/Lower', emoji: '🃏', type: 'PvE', color: '#4ECDC4', desc: 'Beat the dealer' },
  { id: 'rps', name: 'RPS Arena', emoji: '✊', type: 'PvP', color: '#FFD93D', desc: 'Rock Paper Scissors' },
  { id: 'slots', name: 'Lucky Slots', emoji: '🎰', type: 'PvE', color: '#6C5CE7', desc: 'Spin to win' },
];

export default function HomeScreen({ navigation, route, apiUrl }) {
  const { user } = route.params;
  const [balance, setBalance] = useState(user.balance);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
    }, [])
  );

  const fetchBalance = async () => {
    try {
      const res = await fetch(`${apiUrl}/players?name=${user.name}&pin=${user.pin}`);
      const data = await res.json();
      if (data.success) setBalance(data.player.balance);
    } catch (e) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

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
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Bar with Logout */}
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>🎲 Dice Duel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
        <Text style={styles.balanceAmount}>Rs {balance}</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('Wallet', { user: { ...user, balance } })}
        >
          <Text style={styles.addBtnText}>+ Add Money</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>🎮 Select Game</Text>
      <View style={styles.gamesGrid}>
        {GAMES.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { borderColor: game.color + '40' }]}
            onPress={() => navigation.navigate('Game', { game, user: { ...user, balance } })}
          >
            <Text style={styles.gameEmoji}>{game.emoji}</Text>
            <Text style={[styles.gameName, { color: game.color }]}>{game.name}</Text>
            <View style={[styles.badge, { backgroundColor: game.color + '20' }]}>
              <Text style={[styles.badgeText, { color: game.color }]}>{game.type}</Text>
            </View>
            <Text style={styles.gameDesc}>{game.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {user.isAdmin && (
        <TouchableOpacity 
          style={styles.adminBtn}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.adminBtnText}>⚙️ Admin Panel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  appTitle: {
    color: '#ffd200',
    fontSize: 24,
    fontWeight: '800'
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 14
  },
  balanceCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#ffd200'
  },
  balanceLabel: { color: '#aaa', fontSize: 12, letterSpacing: 2 },
  balanceAmount: { color: '#ffd200', fontSize: 44, fontWeight: '800', marginTop: 8 },
  addBtn: { 
    backgroundColor: '#4ECDC4', paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, marginTop: 12 
  },
  addBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 14 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gameCard: {
    backgroundColor: '#16213e', borderRadius: 14, padding: 16,
    width: '47%', borderWidth: 2, alignItems: 'center', marginBottom: 4
  },
  gameEmoji: { fontSize: 36, marginBottom: 8 },
  gameName: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginBottom: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  gameDesc: { color: '#888', fontSize: 11, textAlign: 'center' },
  adminBtn: {
    backgroundColor: '#0f3460', padding: 14, borderRadius: 25,
    alignItems: 'center', marginTop: 20
  },
  adminBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});