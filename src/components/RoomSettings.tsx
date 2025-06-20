
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Settings } from 'lucide-react';

interface RoomSettingsProps {
  settings: {
    undercover_count: number;
    blank_count: number;
    max_players: number;
  };
  onSave: (settings: any) => void;
  onClose: () => void;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({ settings, onSave, onClose }) => {
  const [undercoverCount, setUndercoverCount] = useState(settings.undercover_count);
  const [blankCount, setBlankCount] = useState(settings.blank_count);
  const [maxPlayers, setMaxPlayers] = useState(settings.max_players);

  const handleSave = () => {
    const newSettings = {
      undercover_count: Math.max(1, undercoverCount),
      blank_count: Math.max(0, blankCount),
      max_players: Math.min(Math.max(3, maxPlayers), 20)
    };
    onSave(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Room Settings
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="undercover" className="text-white">
              Undercover Players (minimum 1)
            </Label>
            <Input
              id="undercover"
              type="number"
              min="1"
              max="5"
              value={undercoverCount}
              onChange={(e) => setUndercoverCount(parseInt(e.target.value) || 1)}
              className="bg-white/10 border-white/20 text-white"
            />
            <p className="text-white/70 text-sm mt-1">
              Players who get the different word
            </p>
          </div>

          <div>
            <Label htmlFor="blank" className="text-white">
              Blank Players (minimum 0)
            </Label>
            <Input
              id="blank"
              type="number"
              min="0"
              max="2"
              value={blankCount}
              onChange={(e) => setBlankCount(parseInt(e.target.value) || 0)}
              className="bg-white/10 border-white/20 text-white"
            />
            <p className="text-white/70 text-sm mt-1">
              Players who get no word at all
            </p>
          </div>

          <div>
            <Label htmlFor="maxPlayers" className="text-white">
              Maximum Players
            </Label>
            <Input
              id="maxPlayers"
              type="number"
              min="3"
              max="20"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 10)}
              className="bg-white/10 border-white/20 text-white"
            />
            <p className="text-white/70 text-sm mt-1">
              Total players allowed in the room
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Preview</h4>
            <div className="text-sm text-white/80">
              <div>• {Math.max(1, maxPlayers - undercoverCount - blankCount)} Civilian players</div>
              <div>• {Math.max(1, undercoverCount)} Undercover players</div>
              <div>• {Math.max(0, blankCount)} Blank players</div>
              <div className="mt-2 font-medium">
                Total: {Math.max(1, undercoverCount) + Math.max(0, blankCount) + Math.max(1, maxPlayers - undercoverCount - blankCount)} players
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomSettings;
