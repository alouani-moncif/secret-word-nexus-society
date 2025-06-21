import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { GameState } from '@/types/game';

interface GameResultsProps {
  gameState: GameState;
  onNextRound: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ gameState, onNextRound }) => {
  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const eliminatedPlayers = gameState.players.filter(p => p.isEliminated);
  const activeUndercover = activePlayers.filter(p => p.role === 'undercover');
  const activeCivilians = activePlayers.filter(p => p.role === 'civilian');
  const activeBlanks = activePlayers.filter(p => p.role === 'blank');

  const getGameStatus = () => {
    if (activeBlanks.length > 0 && activePlayers.length <= 2) {
      return {
        message: "Blank player is about to win!",
        variant: "default" as const,
        color: "purple"
      };
    }
    if (activeUndercover.length >= activeCivilians.length && activeUndercover.length > 0) {
      return {
        message: "Undercover agents are winning!",
        variant: "destructive" as const,
        color: "red"
      };
    }
    if (activeUndercover.length === 0) {
      return {
        message: "Civilians have eliminated all undercover agents!",
        variant: "default" as const,
        color: "green"
      };
    }
    return {
      message: "Game continues...",
      variant: "secondary" as const,
      color: "blue"
    };
  };

  const status = getGameStatus();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Round {gameState.currentRound} Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Game Status */}
            <div className={`bg-${status.color}-600/20 border border-${status.color}-600/30 rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold text-white">Current Status</span>
              </div>
              <div className="text-white text-lg">
                {status.message}
              </div>
            </div>

            {/* Players Still Alive */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">
                Players Still in Game ({activePlayers.length})
              </h3>
              <div className="grid gap-2">
                {activePlayers.map(player => (
                  <div key={player.id} className="flex justify-between items-center py-2">
                    <span className="text-white">{player.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {player.points} points
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminated Players */}
            {eliminatedPlayers.length > 0 && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                <h3 className="text-red-300 font-semibold mb-3">
                  Eliminated Players ({eliminatedPlayers.length})
                </h3>
                <div className="grid gap-2">
                  {eliminatedPlayers.map(player => (
                    <div key={player.id} className="flex justify-between items-center py-2">
                      <span className="text-red-200">{player.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={player.role === 'undercover' ? 'destructive' : 
                                  player.role === 'blank' ? 'secondary' : 'default'}
                        >
                          {player.role}
                        </Badge>
                        <Badge variant="outline" className="border-red-300/30 text-red-300">
                          {player.points} points
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-600/20 rounded-lg p-3">
                <div className="text-green-300 font-semibold">Civilians</div>
                <div className="text-white text-xl">{activeCivilians.length}</div>
              </div>
              <div className="bg-red-600/20 rounded-lg p-3">
                <div className="text-red-300 font-semibold">Undercover</div>
                <div className="text-white text-xl">{activeUndercover.length}</div>
              </div>
              <div className="bg-purple-600/20 rounded-lg p-3">
                <div className="text-purple-300 font-semibold">Blank</div>
                <div className="text-white text-xl">{activeBlanks.length}</div>
              </div>
            </div>

            <Button 
              onClick={onNextRound}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameResults;
