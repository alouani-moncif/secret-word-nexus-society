
export interface Player {
  id: string;
  name: string;
  role: 'civilian' | 'undercover' | 'blank';
  word?: string;
  votes: number;
  points: number;
  isEliminated: boolean;
}

export interface GameState {
  players: Player[];
  currentRound: number;
  phase: 'setup' | 'reveal' | 'discussion' | 'voting' | 'results';
  settings: {
    timeLimit: number;
    rounds: number;
  };
}
