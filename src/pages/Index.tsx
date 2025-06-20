
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, EyeOff, Vote, Trophy, RotateCcw } from 'lucide-react';
import PlayerSetup from '@/components/PlayerSetup';
import GameBoard from '@/components/GameBoard';
import VotingPhase from '@/components/VotingPhase';
import GameResults from '@/components/GameResults';
import { useToast } from '@/hooks/use-toast';

export interface Player {
  id: string;
  name: string;
  word: string;
  role: 'civilian' | 'undercover' | 'blank';
  isEliminated: boolean;
  votes: number;
  points: number;
}

export interface GameState {
  phase: 'setup' | 'reveal' | 'discussion' | 'voting' | 'results' | 'gameOver';
  players: Player[];
  currentRound: number;
  civilianWord: string;
  undercoverWord: string;
  blankWord: string;
  winner: 'civilians' | 'undercover' | 'blank' | null;
}

const WORD_PAIRS = [
  { civilian: "Coffee", undercover: "Tea", blank: "" },
  { civilian: "Dog", undercover: "Cat", blank: "" },
  { civilian: "Pizza", undercover: "Burger", blank: "" },
  { civilian: "Summer", undercover: "Winter", blank: "" },
  { civilian: "Ocean", undercover: "Lake", blank: "" },
  { civilian: "Movie", undercover: "TV Show", blank: "" },
  { civilian: "Guitar", undercover: "Piano", blank: "" },
  { civilian: "Basketball", undercover: "Football", blank: "" },
  { civilian: "Apple", undercover: "Orange", blank: "" },
  { civilian: "Car", undercover: "Motorcycle", blank: "" }
];

const Index = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    players: [],
    currentRound: 1,
    civilianWord: '',
    undercoverWord: '',
    blankWord: '',
    winner: null
  });

  const startGame = (playerNames: string[]) => {
    const wordPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const totalPlayers = playerNames.length;
    const undercoverCount = Math.floor(totalPlayers / 3);
    const blankCount = totalPlayers >= 6 ? 1 : 0;
    
    // Assign roles randomly
    const roles: Array<'civilian' | 'undercover' | 'blank'> = [
      ...Array(undercoverCount).fill('undercover'),
      ...Array(blankCount).fill('blank'),
      ...Array(totalPlayers - undercoverCount - blankCount).fill('civilian')
    ];
    
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);
    
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      role: shuffledRoles[index],
      word: shuffledRoles[index] === 'civilian' ? wordPair.civilian : 
            shuffledRoles[index] === 'undercover' ? wordPair.undercover : 
            wordPair.blank,
      isEliminated: false,
      votes: 0,
      points: 0
    }));

    setGameState({
      phase: 'reveal',
      players,
      currentRound: 1,
      civilianWord: wordPair.civilian,
      undercoverWord: wordPair.undercover,
      blankWord: wordPair.blank,
      winner: null
    });

    toast({
      title: "Game Started!",
      description: `${totalPlayers} players ready. ${undercoverCount} undercover, ${blankCount} blank.`,
    });
  };

  const proceedToDiscussion = () => {
    setGameState(prev => ({ ...prev, phase: 'discussion' }));
  };

  const proceedToVoting = () => {
    setGameState(prev => ({ ...prev, phase: 'voting' }));
  };

  const handleVote = (votedPlayerId: string) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map(player => 
        player.id === votedPlayerId 
          ? { ...player, votes: player.votes + 1 }
          : player
      );
      return { ...prev, players: updatedPlayers };
    });
  };

  const eliminatePlayer = () => {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const maxVotes = Math.max(...activePlayers.map(p => p.votes));
    const mostVoted = activePlayers.filter(p => p.votes === maxVotes);
    
    if (mostVoted.length === 1) {
      const eliminatedPlayer = mostVoted[0];
      
      setGameState(prev => {
        const updatedPlayers = prev.players.map(player => ({
          ...player,
          votes: 0, // Reset votes
          isEliminated: player.id === eliminatedPlayer.id ? true : player.isEliminated
        }));
        
        return { ...prev, players: updatedPlayers, phase: 'results' };
      });

      toast({
        title: "Player Eliminated!",
        description: `${eliminatedPlayer.name} (${eliminatedPlayer.role}) has been eliminated!`,
        variant: eliminatedPlayer.role === 'undercover' ? "default" : "destructive"
      });
    } else {
      // Tie - no elimination
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => ({ ...p, votes: 0 })),
        phase: 'discussion'
      }));
      
      toast({
        title: "Tie Vote!",
        description: "No one was eliminated. Continue discussion.",
      });
    }
  };

  const checkWinCondition = () => {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    const activeUndercover = activePlayers.filter(p => p.role === 'undercover');
    const activeCivilians = activePlayers.filter(p => p.role === 'civilian');
    const activeBlanks = activePlayers.filter(p => p.role === 'blank');

    // Blank wins if they're the last one standing
    if (activeBlanks.length > 0 && activePlayers.length <= 2) {
      return 'blank';
    }
    
    // Undercover wins if they equal or outnumber civilians
    if (activeUndercover.length >= activeCivilians.length && activeUndercover.length > 0) {
      return 'undercover';
    }
    
    // Civilians win if all undercover are eliminated
    if (activeUndercover.length === 0) {
      return 'civilians';
    }
    
    return null;
  };

  const nextRound = () => {
    const winner = checkWinCondition();
    
    if (winner) {
      // Award points
      const updatedPlayers = gameState.players.map(player => {
        let pointsToAdd = 0;
        
        if (winner === 'civilians' && player.role === 'civilian' && !player.isEliminated) {
          pointsToAdd = 2;
        } else if (winner === 'undercover' && player.role === 'undercover' && !player.isEliminated) {
          pointsToAdd = 3;
        } else if (winner === 'blank' && player.role === 'blank' && !player.isEliminated) {
          pointsToAdd = 5;
        }
        
        return { ...player, points: player.points + pointsToAdd };
      });
      
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        winner,
        phase: 'gameOver'
      }));
    } else {
      setGameState(prev => ({ ...prev, phase: 'discussion' }));
    }
  };

  const newGame = () => {
    const playerNames = gameState.players.map(p => p.name);
    startGame(playerNames);
  };

  const resetGame = () => {
    setGameState({
      phase: 'setup',
      players: [],
      currentRound: 1,
      civilianWord: '',
      undercoverWord: '',
      blankWord: '',
      winner: null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in">
            🕵️ Undercover
          </h1>
          <p className="text-purple-200 animate-fade-in">
            Find the undercover agents among you!
          </p>
        </div>

        {gameState.phase === 'setup' && (
          <PlayerSetup onStartGame={startGame} />
        )}

        {gameState.phase === 'reveal' && (
          <GameBoard 
            gameState={gameState}
            onProceedToDiscussion={proceedToDiscussion}
          />
        )}

        {gameState.phase === 'discussion' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Discussion Phase - Round {gameState.currentRound}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Discuss and try to figure out who has different words. 
                  Each player should describe their word without saying it directly.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {gameState.players.filter(p => !p.isEliminated).map(player => (
                    <div key={player.id} className="bg-white/5 rounded-lg p-3">
                      <div className="text-white font-medium">{player.name}</div>
                      <Badge variant="secondary" className="mt-1">
                        {player.points} points
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={proceedToVoting}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Vote className="w-4 h-4 mr-2" />
                  Proceed to Voting
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gameState.phase === 'voting' && (
          <VotingPhase 
            gameState={gameState}
            onVote={handleVote}
            onEliminatePlayer={eliminatePlayer}
          />
        )}

        {gameState.phase === 'results' && (
          <GameResults 
            gameState={gameState}
            onNextRound={nextRound}
          />
        )}

        {gameState.phase === 'gameOver' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Game Over!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {gameState.winner === 'civilians' && '🏆 Civilians Win!'}
                    {gameState.winner === 'undercover' && '🕵️ Undercover Wins!'}
                    {gameState.winner === 'blank' && '🎭 Blank Player Wins!'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">Final Scores</h3>
                      {gameState.players
                        .sort((a, b) => b.points - a.points)
                        .map(player => (
                          <div key={player.id} className="flex justify-between items-center py-1">
                            <span className="text-white">{player.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={player.role === 'undercover' ? 'destructive' : 
                                            player.role === 'blank' ? 'secondary' : 'default'}>
                                {player.role}
                              </Badge>
                              <span className="text-white font-bold">{player.points}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">Words This Round</h3>
                      <div className="space-y-2 text-sm">
                        <div className="text-green-300">Civilian: {gameState.civilianWord}</div>
                        <div className="text-red-300">Undercover: {gameState.undercoverWord}</div>
                        {gameState.blankWord && (
                          <div className="text-purple-300">Blank: (No word)</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={newGame} className="bg-green-600 hover:bg-green-700">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                  <Button onClick={resetGame} variant="outline" className="border-white/20 text-white">
                    Change Players
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
