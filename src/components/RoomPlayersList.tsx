
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, X } from 'lucide-react';

interface RoomPlayer {
  id: string;
  player_name: string;
  user_id: string;
  is_ready: boolean;
  joined_at: any;
}

interface RoomPlayersListProps {
  players: RoomPlayer[];
  maxPlayers: number;
  isCreator: boolean;
  creatorId: string;
  onKickPlayer: (playerId: string) => void;
}

const RoomPlayersList: React.FC<RoomPlayersListProps> = ({
  players,
  maxPlayers,
  isCreator,
  creatorId,
  onKickPlayer
}) => {
  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-white font-medium mb-3">
        Players ({players.length}/{maxPlayers})
      </h3>
      <div className="grid gap-2">
        {players.map(player => (
          <div key={player.id} className="flex items-center justify-between bg-white/5 rounded p-2">
            <div className="flex items-center gap-2">
              {player.user_id === creatorId && (
                <Crown className="w-4 h-4 text-yellow-400" />
              )}
              <span className="text-white">{player.player_name}</span>
              {player.is_ready && (
                <Badge variant="default" className="bg-green-600 text-white">
                  Ready
                </Badge>
              )}
            </div>
            {isCreator && player.user_id !== creatorId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onKickPlayer(player.id)}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomPlayersList;
