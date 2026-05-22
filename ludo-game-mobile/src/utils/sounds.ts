import { Vibration, Platform } from 'react-native';

let audioContext: any = null;

function getAudioContext() {
  if (Platform.OS === 'web' && !audioContext) {
    try { audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch (e) {}
  }
  return audioContext;
}

function playBeep(frequency: number, duration: number, volume: number = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) { Vibration.vibrate(duration); return; }
  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  } catch (e) { Vibration.vibrate(duration); }
}

export function playDiceRoll() {
  playBeep(200, 50); setTimeout(() => playBeep(300, 50), 80);
  setTimeout(() => playBeep(400, 50), 160); setTimeout(() => playBeep(500, 100), 240);
  Vibration.vibrate([50, 30, 50, 30, 100]);
}

export function playWin() {
  playBeep(523, 150, 0.5); setTimeout(() => playBeep(659, 150, 0.5), 150);
  setTimeout(() => playBeep(784, 300, 0.5), 300);
  Vibration.vibrate([100, 50, 100, 50, 300]);
}

export function playLose() {
  playBeep(400, 200, 0.4); setTimeout(() => playBeep(300, 200, 0.4), 200);
  setTimeout(() => playBeep(200, 400, 0.4), 400);
  Vibration.vibrate(200);
}

export function playTick() { playBeep(1000, 30, 0.2); }

export function playMatchFound() {
  playBeep(523, 100, 0.5); setTimeout(() => playBeep(659, 100, 0.5), 100);
  setTimeout(() => playBeep(784, 100, 0.5), 200); setTimeout(() => playBeep(1047, 300, 0.6), 300);
  Vibration.vibrate([100, 50, 100, 50, 100, 50, 300]);
}

export function playButtonClick() { playBeep(800, 30, 0.2); }
