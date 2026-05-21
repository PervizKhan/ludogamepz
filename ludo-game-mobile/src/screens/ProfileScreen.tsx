import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';

export default function ProfileScreen() {
  const { user, logout } = useUser();
  const [stats, setStats] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        api.getPlayerStats(user.id).then(res => {
          if (res.stats) setStats(res.stats);
        }).catch(() => {});
      }
    }, [user?.id])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <View style={{ alignItems: 'center', padding: 30, paddingTop: 60, backgroundColor: '#16213e' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>{(user?.username || 'P')[0].toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 5 }}>{user?.username}</Text>
        <Text style={{ fontSize: 14, color: '#a0a0a0' }}>{user?.email || 'No email'}</Text>
      </View>

      <View style={{ backgroundColor: '#0f3460', margin: 15, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' }}>
        <Text style={{ color: '#a0a0a0', fontSize: 14, marginBottom: 8 }}>Coins</Text>
        <Text style={{ color: '#FFD700', fontSize: 36, fontWeight: 'bold' }}>🪙 {(user?.balance || 0).toLocaleString()}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 15, gap: 10 }}>
        {[{ label: 'Games', value: stats?.total_games || 0 }, { label: 'Wins', value: stats?.wins || 0 }, { label: 'Win Rate', value: (stats?.win_rate || 0) + '%' }, { label: 'Earnings', value: '🪙 ' + (stats?.total_winnings || 0).toLocaleString() }].map((s, i) => (
          <View key={i} style={{ backgroundColor: '#0f3460', padding: 15, borderRadius: 12, width: '47%', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 5 }}>{s.value}</Text>
            <Text style={{ fontSize: 12, color: '#a0a0a0' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#e94560', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
