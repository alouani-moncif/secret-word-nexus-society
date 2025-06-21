import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, Users, AlertTriangle } from 'lucide-react';
import { GameState } from '@/types/game';

interface VotingPhaseProps {
  gameState: GameState;
  onVote: (playerId: string) => void;
  onEliminatePlayer: () => void;
}

const VotingPhase: React.FC<VotingPhaseProps> = ({ gameState, onVote, onEliminatePlayer }) => {
  const [hasVoted, setHasVoted] = useState<Set<string>>(new Set());
  const [votingComplete, setVotingComplete] = useState(false);

  const activePlayers = gameState.players.filter(p => !p.isEliminated);
  const totalVotes = activePlayers.reduce((sum, player) => sum + player.votes, 0);
  const maxVotes = Math.max(...activePlayers.map(p => p.votes));
  const mostVotedPlayers = activePlayers.filter(p => p.votes === maxVotes && p.votes > 0);

  const handleVote = (playerId: string) => {
    onVote(playerId);
    // In a real game, you'd track who voted, but for simplicity we'll just increment
  };

  const completeVoting = () => {
    setVotingComplete(true);
  };

  if (votingComplete) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Voting Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Vote Count:</h3>
                <div className="space-y-2">
                  {activePlayers
                    .sort((a, b) => b.votes - a.votes)
                    .map(player => (
                      <div key={player.id} className="flex justify-between items-center">
                        <span className="text-white">{player.name}</span>
                        <Badge variant={player.votes === maxVotes && maxVotes > 0 ? "destructive" : "secondary"}>
                          {player.votes} votes
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              {mostVotedPlayers.length === 1 ? (
                <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-300 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Player to be eliminated:</span>
                  </div>
                  <div className="text-white font-bold text-lg">
                    {mostVotedPlayers[0].name}
                  </div>
                </div>
              ) : mostVotedPlayers.length > 1 ? (
                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-300 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Tie vote - no elimination</span>
                  </div>
                  <div className="text-white">
                    {mostVotedPlayers.map(p => p.name).join(', ')} tied with {maxVotes} votes each.
                  </div>
                </div>
              ) : (
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                  <div className="text-blue-300 font-semibold">No votes cast - no elimination</div>
                </div>
              )}

              <Button 
                onClick={onEliminatePlayer}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Continue Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Voting Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/90 mb-4">
                Vote for the player you think is undercover. 
                The player with the most votes will be eliminated.
              </p>
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {activePlayers.length} players remaining
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              {activePlayers.map(player => (
                <div
                  key={player.id}
                  className="bg-white/5 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="text-white font-medium">{player.name}</div>
                    <div className="text-white/60 text-sm">{player.points} points</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-white/20 text-white">
                      {player.votes} votes
                    </Badge>
                    <Button
                      onClick={() => handleVote(player.id)}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-red-600/20"
                    >
                      Vote
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button 
                onClick={completeVoting}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={totalVotes === 0}
              >
                <Users className="w-4 h-4 mr-2" />
                Finish Voting ({totalVotes} votes cast)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VotingPhase;
