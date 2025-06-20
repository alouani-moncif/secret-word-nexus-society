
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlayerSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<string[]>(['']);
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (newPlayerName.trim() && !players.includes(newPlayerName.trim())) {
      setPlayers([...players.filter(p => p), newPlayerName.trim()]);
      setNewPlayerName('');
    } else {
      toast({
        title: "Invalid Name",
        description: "Player name must be unique and not empty.",
        variant: "destructive"
      });
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = name;
    setPlayers(updated);
  };

  const handleStartGame = () => {
    const validPlayers = players.filter(p => p.trim());
    if (validPlayers.length < 3) {
      toast({
        title: "Not Enough Players",
        description: "You need at least 3 players to start the game.",
        variant: "destructive"
      });
      return;
    }
    if (validPlayers.length > 10) {
      toast({
        title: "Too Many Players",
        description: "Maximum 10 players allowed.",
        variant: "destructive"
      });
      return;
    }
    
    const uniquePlayers = [...new Set(validPlayers)];
    if (uniquePlayers.length !== validPlayers.length) {
      toast({
        title: "Duplicate Names",
        description: "All player names must be unique.",
        variant: "destructive"
      });
      return;
    }
    
    onStartGame(uniquePlayers);
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Setup Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                  placeholder={`Player ${index + 1} name`}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                {players.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removePlayer(index)}
                    className="border-white/20 text-white hover:bg-red-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Add new player"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            />
            <Button
              onClick={addPlayer}
              variant="outline"
              size="icon"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white/80 text-sm">
              <strong>Game Rules:</strong><br />
              • 3-10 players needed<br />
              • Most players get the same word (civilians)<br />
              • 1-3 players get a different word (undercover)<br />
              • 1 player might get no word (blank, in 6+ player games)<br />
              • Find and eliminate the undercover agents!
            </p>
          </div>

          <Button 
            onClick={handleStartGame}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={players.filter(p => p.trim()).length < 3}
          >
            Start Game ({players.filter(p => p.trim()).length} players)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerSetup;
