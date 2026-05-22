import { Audio } from 'expo-av';

let diceSound: Audio.Sound | null = null;
let winSound: Audio.Sound | null = null;
let loseSound: Audio.Sound | null = null;
let tickSound: Audio.Sound | null = null;
let matchFoundSound: Audio.Sound | null = null;

export async function loadSounds() {
  try {
    // Using bundled sounds or generated
    const { sound: dice } = await Audio.Sound.createAsync(
      require('../assets/sounds/dice.mp3'),
      { volume: 0.7 }
    );
    diceSound = dice;

    const { sound: win } = await Audio.Sound.createAsync(
      require('../assets/sounds/win.mp3'),
      { volume: 0.8 }
    );
    winSound = win;

    const { sound: lose } = await Audio.Sound.createAsync(
      require('../assets/sounds/lose.mp3'),
      { volume: 0.6 }
    );
    loseSound = lose;

    const { sound: tick } = await Audio.Sound.createAsync(
      require('../assets/sounds/tick.mp3'),
      { volume: 0.4 }
    );
    tickSound = tick;

    const { sound: match } = await Audio.Sound.createAsync(
      require('../assets/sounds/matchfound.mp3'),
      { volume: 0.8 }
    );
    matchFoundSound = match;
  } catch (e) {
    console.log('Sounds will use fallback');
  }
}

export async function playDiceRoll() {
  try {
    if (diceSound) {
      await diceSound.replayAsync();
    } else {
      // Fallback: vibrate
      const { Vibration } = require('react-native');
      Vibration.vibrate(100);
    }
  } catch (e) {}
}

export async function playWin() {
  try {
    if (winSound) await winSound.replayAsync();
  } catch (e) {}
}

export async function playLose() {
  try {
    if (loseSound) await loseSound.replayAsync();
  } catch (e) {}
}

export async function playTick() {
  try {
    if (tickSound) await tickSound.replayAsync();
  } catch (e) {}
}

export async function playMatchFound() {
  try {
    if (matchFoundSound) await matchFoundSound.replayAsync();
  } catch (e) {}
}

export async function unloadSounds() {
  if (diceSound) await diceSound.unloadAsync();
  if (winSound) await winSound.unloadAsync();
  if (loseSound) await loseSound.unloadAsync();
  if (tickSound) await tickSound.unloadAsync();
  if (matchFoundSound) await matchFoundSound.unloadAsync();
}
export function playButtonClick() {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.2;
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {}
}
