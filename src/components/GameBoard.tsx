import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { GameState } from '@/types/game';

interface GameBoardProps {
  gameState: GameState;
  onProceedToDiscussion: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onProceedToDiscussion }) => {
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const toggleReveal = (playerId: string) => {
    setRevealedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const nextPlayer = () => {
    if (currentPlayerIndex < gameState.players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      onProceedToDiscussion();
    }
  };

  const currentPlayer = gameState.players[currentPlayerIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            Word Reveal Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentPlayer.name}'s Turn
              </h2>
              <p className="text-white/80 mb-4">
                Look at your word, memorize it, then hide it before passing the device.
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => toggleReveal(currentPlayer.id)}
                  className={`w-full h-20 text-xl font-bold ${
                    revealedPlayers.has(currentPlayer.id)
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {revealedPlayers.has(currentPlayer.id) ? (
                    <>
                      <EyeOff className="w-6 h-6 mr-2" />
                      Hide Word
                    </>
                  ) : (
                    <>
                      <Eye className="w-6 h-6 mr-2" />
                      Reveal My Word
                    </>
                  )}
                </Button>

                {revealedPlayers.has(currentPlayer.id) && (
                  <div className="bg-white/10 rounded-lg p-4 animate-scale-in">
                    <div className="text-3xl font-bold text-white mb-2">
                      {currentPlayer.word || "You have no word!"}
                    </div>
                    {!currentPlayer.word && (
                      <Badge variant="secondary" className="text-sm">
                        You are the BLANK player
                      </Badge>
                    )}
                    <p className="text-white/70 text-sm mt-2">
                      Remember this word and don't let others see it!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-white/60">
              <span>Player {currentPlayerIndex + 1} of {gameState.players.length}</span>
              <div className="flex gap-1">
                {gameState.players.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= currentPlayerIndex ? 'bg-purple-400' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={nextPlayer}
              disabled={!revealedPlayers.has(currentPlayer.id)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {currentPlayerIndex < gameState.players.length - 1 ? (
                <>
                  Next Player
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Discussion
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="pt-6">
          <h3 className="text-white font-semibold mb-3">Players in this game:</h3>
          <div className="grid grid-cols-2 gap-2">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`p-2 rounded-lg text-center ${
                  index <= currentPlayerIndex
                    ? 'bg-green-600/20 text-green-300'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {player.name}
                {index <= currentPlayerIndex && (
                  <div className="text-xs mt-1">✓ Ready</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameBoard;
