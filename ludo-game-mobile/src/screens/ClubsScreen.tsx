import React, { useEffect, useState } from 'react';
import { playButtonClick } from "../utils/sounds";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

interface Club {
  id: number;
  name: string;
  code: string;
  bet_amount: number;
  online_players: number;
}

export default function ClubsScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user, refreshBalance } = useUser();

  useEffect(() => {
    loadClubs();
    refreshBalance();
  }, []);

  const loadClubs = async () => {
    try {
      const data = await api.getClubs();
      setClubs(data.clubs);
    } catch (error) {
      console.error('Failed to load clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = (club: Club) => {
    const balance = user?.balance || 0;
    if (balance < club.bet_amount) {
      Alert.alert(
        'Insufficient Balance',
        `You need 🪙 ${club.bet_amount} but you have 🪙 ${balance}. Play in a lower club or add money.`,
        [{ text: 'OK' }]
      );
      return;
    }
    playButtonClick(); navigation.navigate('Matchmaking', { club });
  };

  const getClubIcon = (code: string) => {
    const icons: Record<string, string> = {
      mumbai: '🔵', karachi: '🟢', delhi: '🔴', lahore: '🟡', bangalore: '🟣', dubai: '⚪',
    };
    return icons[code] || '🎲';
  };

  const renderClub = ({ item }: { item: Club }) => {
    const canAfford = (user?.balance || 0) >= item.bet_amount;
    return (
      <TouchableOpacity
        style={[styles.clubCard, !canAfford && styles.clubCardDisabled]}
        onPress={() => handleJoinClub(item)}
      >
        <View style={styles.clubHeader}>
          <Text style={styles.clubIcon}>{getClubIcon(item.code)}</Text>
          <View style={styles.clubInfo}>
            <Text style={styles.clubName}>{item.name}</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{item.online_players} online</Text>
            </View>
          </View>
        </View>
        <View style={styles.betContainer}>
          <Text style={styles.betLabel}>Entry Fee</Text>
          <Text style={styles.betAmount}>🪙 {item.bet_amount}</Text>
        </View>
        <View style={styles.prizeContainer}>
          <Text style={styles.prizeLabel}>You Win</Text>
          <Text style={styles.prizeAmount}>🪙 {item.bet_amount * 2}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.playButton, !canAfford && styles.playButtonDisabled]}
          onPress={() => handleJoinClub(item)}
        >
          <Text style={styles.playButtonText}>
            {canAfford ? 'PLAY NOW' : `NEED 🪙 ${item.bet_amount - (user?.balance || 0)} MORE`}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Select Club</Text>
        <Text style={styles.headerSubtitle}>Balance: 🪙 {(user?.balance || 0).toLocaleString()}</Text>
      </View>
      <FlatList
        data={clubs}
        renderItem={renderClub}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#16213e' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFD700' },
  headerSubtitle: { fontSize: 14, color: '#4ECDC4', marginTop: 5 },
  list: { padding: 15 },
  clubCard: { backgroundColor: '#0f3460', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 2, borderColor: '#e94560' },
  clubCardDisabled: { opacity: 0.5, borderColor: '#555' },
  clubHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  clubIcon: { fontSize: 40, marginRight: 15 },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', marginRight: 6 },
  onlineText: { color: '#00ff88', fontSize: 12 },
  betContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 12, borderRadius: 10, marginBottom: 10 },
  betLabel: { color: '#a0a0a0', fontSize: 14 },
  betAmount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  prizeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 12, borderRadius: 10, marginBottom: 15 },
  prizeLabel: { color: '#FFD700', fontSize: 14 },
  prizeAmount: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  playButton: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, alignItems: 'center' },
  playButtonDisabled: { backgroundColor: '#555' },
  playButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
