import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export class PushNotificationService {
  async sendPushNotification(pushToken: string, title: string, body: string, data?: any) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    }];

    try {
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  async notifyMatchFound(pushToken: string, opponentName: string, betAmount: number) {
    return this.sendPushNotification(
      pushToken,
      'Match Found! 🎮',
      `You're playing against ${opponentName} for ₹${betAmount}`,
      { type: 'match_found', opponentName, betAmount }
    );
  }

  async notifyGameResult(pushToken: string, won: boolean, amount: number) {
    const title = won ? '🏆 You Won!' : '😔 Game Over';
    const body = won 
      ? `Congratulations! You won ₹${amount}` 
      : `You lost ₹${amount}. Better luck next time!`;

    return this.sendPushNotification(
      pushToken,
      title,
      body,
      { type: 'game_result', won, amount }
    );
  }

  async notifyTurnReminder(pushToken: string, opponentName: string) {
    return this.sendPushNotification(
      pushToken,
      'Your Turn! 🎲',
      `${opponentName} is waiting for you to roll`,
      { type: 'turn_reminder' }
    );
  }
}

export const pushService = new PushNotificationService();
