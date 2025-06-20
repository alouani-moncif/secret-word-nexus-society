
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  role: 'civilian' | 'undercover' | 'blank';
  isEliminated: boolean;
  points: number;
}

interface ScoreDisplayProps {
  players: Player[];
  winner: 'civilians' | 'undercover' | 'blank' | null;
  roundNumber: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ players, winner, roundNumber }) => {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const topPlayer = sortedPlayers[0];

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

  const getWinnerIcon = (winner: string) => {
    switch (winner) {
      case 'civilians':
        return '🏆';
      case 'undercover':
        return '🕵️';
      case 'blank':
        return '🎭';
      default:
        return '🏁';
    }
  };

  const getPointsForWin = (role: string, isWinner: boolean) => {
    if (!isWinner) return 0;
    switch (role) {
      case 'civilian':
        return 2;
      case 'undercover':
        return 3;
      case 'blank':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Round {roundNumber} Results
            </div>
            <div className="text-2xl">
              {getWinnerIcon(winner || '')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {winner === 'civilians' && '🏆 Civilians Win!'}
              {winner === 'undercover' && '🕵️ Undercover Wins!'}
              {winner === 'blank' && '🎭 Blank Player Wins!'}
            </h2>
            <p className="text-white/80">
              {winner === 'civilians' && 'All undercover agents have been eliminated!'}
              {winner === 'undercover' && 'The undercover agents have taken control!'}
              {winner === 'blank' && 'The blank player has survived to the end!'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sortedPlayers.map((player, index) => {
              const isWinningRole = 
                (winner === 'civilians' && player.role === 'civilian') ||
                (winner === 'undercover' && player.role === 'undercover') ||
                (winner === 'blank' && player.role === 'blank');
              
              const pointsEarned = getPointsForWin(player.role, isWinningRole && !player.isEliminated);

              return (
                <Card 
                  key={player.id} 
                  className={`${
                    index === 0 
                      ? 'bg-gradient-to-br from-yellow-600/30 to-orange-600/30 border-yellow-400/50' 
                      : 'bg-white/5'
                  } border-white/20`}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {index === 0 && <Star className="w-5 h-5 text-yellow-400" />}
                      <h3 className="text-white font-bold">{player.name}</h3>
                      {index === 0 && <Star className="w-5 h-5 text-yellow-400" />}
                    </div>
                    
                    <div className="flex justify-center items-center gap-2 mb-3">
                      <Badge variant={getRoleColor(player.role)}>
                        {player.role}
                      </Badge>
                      {player.isEliminated && (
                        <Badge variant="outline" className="border-red-400 text-red-400">
                          Eliminated
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/70">Previous:</span>
                        <span className="text-white font-medium">
                          {player.points - pointsEarned} pts
                        </span>
                      </div>
                      
                      {pointsEarned > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-400">Round bonus:</span>
                          <span className="text-green-400 font-medium">
                            +{pointsEarned} pts
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-white/20 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">Total:</span>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-bold text-lg">
                              {player.points}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scoring System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-blue-400 font-semibold">Civilians Win</div>
                <div className="text-white/80">+2 points each</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-red-400 font-semibold">Undercover Win</div>
                <div className="text-white/80">+3 points each</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-purple-400 font-semibold">Blank Wins</div>
                <div className="text-white/80">+5 points</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreDisplay;
