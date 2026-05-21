export interface Club {
  id: number;
  name: string;
  code: string;
  bet_amount: number;
  online_players: number;
  icon?: string;
}

export interface User {
  id: number;
  username: string;
  phone?: string;
  balance: number;
}

export interface Game {
  id: number;
  club_id: number;
  player_a_id?: number;
  player_b_id?: number;
  player_a_name: string;
  player_b_name: string;
  player_a_rolls: number[];
  player_b_rolls: number[];
  player_a_total: number;
  player_b_total: number;
  current_turn?: 'A' | 'B';
  winner_id?: number;
  bet_amount: number;
  status: 'pending' | 'waiting' | 'playing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface MatchmakingRequest {
  userId: number;
  username: string;
  clubId: number;
  betAmount: number;
  timestamp: number;
}

export interface BotPlayer {
  id: string;
  name: string;
  avatar?: string;
  skillLevel: 'low' | 'medium' | 'high';
}