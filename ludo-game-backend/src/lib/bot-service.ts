import { BotPlayer } from '@/types';

const BOT_NAMES = [
  'Haris Kamal', 'Junaid Akbar', 'Ali Hassan', 'Rahul Sharma',
  'Vikram Patel', 'Ayesha Khan', 'Priya Singh', 'Mohammad Irfan',
  'Sanaullah Khan', 'Deepak Kumar', 'Fatima Zahra', 'Imran Qureshi',
  'Neha Gupta', 'Bilal Ahmed', 'Rajesh Verma', 'Zainab Ali',
  'Kamran Shah', 'Anjali Mehta', 'Tariq Jameel', 'Pooja Sharma',
  'Usman Ghani', 'Shreya Iyer', 'Faisal Khan', 'Arjun Reddy',
  'Mehak Ali', 'Sohail Tanvir', 'Divya Nair', 'Hamza Sheikh',
  'Kiran Rao', 'Babar Azam', 'Sneha Patil', 'Danish Taimoor'
];

export class BotService {
  private usedNames: Set<string> = new Set();

  generateBot(): BotPlayer {
    const availableNames = BOT_NAMES.filter(n => !this.usedNames.has(n));
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    this.usedNames.add(name);

    return {
      id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      skillLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    };
  }

  // Simulate dice roll with slight delay to feel human
  async rollDice(): Promise<number> {
    const delay = 800 + Math.random() * 1500; // 0.8-2.3s delay
    await new Promise(resolve => setTimeout(resolve, delay));
    return Math.floor(Math.random() * 6) + 1;
  }

  releaseBot(name: string) {
    this.usedNames.delete(name);
  }
}

export const botService = new BotService();
