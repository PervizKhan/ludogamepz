import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';

export default function LoginScreen({ navigation, apiUrl }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      console.log('Logging in:', name, 'API:', apiUrl);
      
      // Try to login
      const res = await fetch(`${apiUrl}/players?name=${encodeURIComponent(name.trim())}&pin=${pin}`);
      const data = await res.json();
      console.log('Login response:', data);

      if (data.success) {
        navigation.replace('Home', { user: data.player });
      } else {
        // Register new player
        const regRes = await fetch(`${apiUrl}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), pin })
        });
        const regData = await regRes.json();
        console.log('Register response:', regData);

        if (regData.success) {
          navigation.replace('Home', { user: regData.player });
        } else {
          setError(regData.message || 'Registration failed');
        }
      }
    } catch (e) {
      console.log('Error:', e.message);
      setError('Cannot connect to server. Check if backend is running.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>🎲 Dice Duel</Text>
      <Text style={styles.subtitle}>Multi-Game Betting Arena</Text>

      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="4-Digit PIN"
          placeholderTextColor="#888"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Enter Game'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        First time? Just enter name & PIN to register
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffd200',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30
  },
  form: {
    width: '100%',
    maxWidth: 350,
    gap: 12
  },
  error: {
    color: '#FF6B6B',
    backgroundColor: '#FF6B6B20',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 4
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#0f3460',
    outlineStyle: 'none'
  },
  button: {
    backgroundColor: '#ffd200',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#1a1a2e',
    fontWeight: '800',
    fontSize: 18
  },
  footer: {
    color: '#666',
    marginTop: 24,
    fontSize: 13
  }
});