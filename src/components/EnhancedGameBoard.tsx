
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Users, Clock, Trophy } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  word: string;
  role: 'civilian' | 'undercover' | 'blank';
  isEliminated: boolean;
  votes: number;
  points: number;
}

interface GameState {
  phase: 'setup' | 'reveal' | 'discussion' | 'voting' | 'results' | 'gameOver';
  players: Player[];
  currentRound: number;
  civilianWord: string;
  undercoverWord: string;
  blankWord: string;
  winner: 'civilians' | 'undercover' | 'blank' | null;
}

interface EnhancedGameBoardProps {
  gameState: GameState;
  onProceedToDiscussion: () => void;
}

const EnhancedGameBoard: React.FC<EnhancedGameBoardProps> = ({ 
  gameState, 
  onProceedToDiscussion 
}) => {
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const toggleWordReveal = (playerId: string) => {
    const newRevealed = new Set(revealedWords);
    if (newRevealed.has(playerId)) {
      newRevealed.delete(playerId);
    } else {
      newRevealed.add(playerId);
    }
    setRevealedWords(newRevealed);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'undercover':
        return 'destructive';
      case 'blank':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Word Reveal - Round {gameState.currentRound}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <Badge className="bg-purple-600">
                {gameState.players.length} Players
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-center">
                🤫 <strong>Tap your card to reveal your word secretly</strong> 🤫
              </p>
              <p className="text-white/70 text-center text-sm mt-2">
                Don't let others see your word! Memorize it, then proceed to discussion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {gameState.players.map(player => (
              <div
                key={player.id}
                className="group relative"
              >
                <Card 
                  className={`bg-gradient-to-br cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    revealedWords.has(player.id)
                      ? 'from-purple-600/30 to-blue-600/30 border-purple-400/50 shadow-lg shadow-purple-500/20'
                      : 'from-white/10 to-white/5 border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => toggleWordReveal(player.id)}
                >
                  <CardContent className="p-4 text-center min-h-[120px] flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-2">{player.name}</h3>
                      <div className="flex justify-center items-center gap-2 mb-3">
                        <Badge variant={getRoleColor(player.role)} className="text-xs">
                          {player.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          {player.points}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="relative h-12 flex items-center justify-center">
                      {revealedWords.has(player.id) ? (
                        <div className="text-center">
                          <div className="text-white text-lg font-bold mb-1">
                            {player.word || "NO WORD"}
                          </div>
                          <div className="flex items-center justify-center text-white/60">
                            <Eye className="w-4 h-4 mr-1" />
                            <span className="text-xs">Revealed</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-white/50 text-sm mb-1">Tap to reveal</div>
                          <div className="flex items-center justify-center text-white/40">
                            <EyeOff className="w-4 h-4 mr-1" />
                            <span className="text-xs">Hidden</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Current Scores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gameState.players
                .sort((a, b) => b.points - a.points)
                .map(player => (
                  <div key={player.id} className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-white font-medium text-sm">{player.name}</div>
                    <div className="text-white/70 text-xs">{player.points} pts</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">🎯 Game Objective</h3>
            <div className="text-white/90 text-sm space-y-1">
              <div>• <strong>Civilians:</strong> Find and eliminate all undercover players</div>
              <div>• <strong>Undercover:</strong> Survive until you equal/outnumber civilians</div>
              <div>• <strong>Blank:</strong> Stay hidden until you're in the final 2 players</div>
            </div>
          </div>

          <Button 
            onClick={onProceedToDiscussion}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            size="lg"
          >
            Everyone Ready? Start Discussion! 
            <Users className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedGameBoard;
