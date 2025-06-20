import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, LogOut, Crown, UserMinus, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoomSettings from './RoomSettings';
import RoomChat from './RoomChat';

interface RoomSettings {
  undercover_count: number;
  blank_count: number;
  max_players: number;
}

interface Room {
  id: string;
  name: string;
  code: string;
  creator_id: string;
  settings: RoomSettings;
}

interface RoomPlayer {
  id: string;
  user_id: string;
  player_name: string;
  is_ready: boolean;
}

interface RoomLobbyProps {
  user: any;
  onStartGame: (roomId: string, players: RoomPlayer[], settings: any) => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ user, onStartGame, onLeaveRoom }) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
    setupRealtimeSubscriptions();
  }, []);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading rooms:', error);
    } else {
      const typedRooms = (data || []).map(room => ({
        ...room,
        settings: room.settings as RoomSettings
      }));
      setRooms(typedRooms);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const roomsChannel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, () => {
        loadRooms();
      })
      .subscribe();

    const playersChannel = supabase
      .channel('room-players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players'
      }, () => {
        if (currentRoom) {
          loadRoomPlayers(currentRoom.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(playersChannel);
    };
  };

  const loadRoomPlayers = async (roomId: string) => {
    const { data, error } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error loading room players:', error);
    } else {
      setRoomPlayers(data || []);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    setLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          code,
          creator_id: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          player_name: user.user_metadata?.display_name || user.email || 'Player'
        });

      const typedRoom = {
        ...roomData,
        settings: roomData.settings as RoomSettings
      };
      setCurrentRoom(typedRoom);
      setNewRoomName('');
      await loadRoomPlayers(roomData.id);

      toast({
        title: "Room Created!",
        description: `Room code: ${code}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (roomError) throw new Error('Room not found');

      const { data: existingPlayer } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (!existingPlayer) {
        const { data: playersCount } = await supabase
          .from('room_players')
          .select('id')
          .eq('room_id', roomData.id);

        const settings = roomData.settings as RoomSettings;
        if (playersCount && playersCount.length >= settings.max_players) {
          throw new Error('Room is full');
        }

        await supabase
          .from('room_players')
          .insert({
            room_id: roomData.id,
            user_id: user.id,
            player_name: user.user_metadata?.display_name || user.email || 'Player'
          });
      }

      const typedRoom = {
        ...roomData,
        settings: roomData.settings as RoomSettings
      };
      setCurrentRoom(typedRoom);
      setRoomCode('');
      await loadRoomPlayers(roomData.id);

      toast({
        title: "Joined Room!",
        description: `Welcome to ${roomData.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;

    try {
      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('user_id', user.id);

      if (currentRoom.creator_id === user.id) {
        await supabase
          .from('rooms')
          .update({ is_active: false })
          .eq('id', currentRoom.id);
      }

      setCurrentRoom(null);
      setRoomPlayers([]);
      onLeaveRoom();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const kickPlayer = async (playerId: string) => {
    if (currentRoom?.creator_id !== user.id) return;

    try {
      await supabase
        .from('room_players')
        .delete()
        .eq('id', playerId);

      toast({
        title: "Player Kicked",
        description: "Player has been removed from the room",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateRoomSettings = async (settings: RoomSettings) => {
    if (!currentRoom || currentRoom.creator_id !== user.id) return;

    try {
      await supabase
        .from('rooms')
        .update({ settings })
        .eq('id', currentRoom.id);

      setCurrentRoom({ ...currentRoom, settings });
      setShowSettings(false);

      toast({
        title: "Settings Updated",
        description: "Room settings have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startGame = () => {
    if (!currentRoom || roomPlayers.length < 3) return;
    onStartGame(currentRoom.id, roomPlayers, currentRoom.settings);
  };

  if (currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🕵️ {currentRoom.name}
            </h1>
            <div className="flex justify-center items-center gap-4">
              <Badge className="bg-white/20 text-white">
                Room Code: {currentRoom.code}
              </Badge>
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {showChat ? 'Hide Chat' : 'Show Chat'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Players ({roomPlayers.length}/{currentRoom.settings.max_players})
                    </div>
                    <div className="flex gap-2">
                      {currentRoom.creator_id === user.id && (
                        <Button
                          onClick={() => setShowSettings(true)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={leaveRoom}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-red-600/20"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {roomPlayers.map(player => (
                      <div key={player.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{player.player_name}</div>
                          {currentRoom.creator_id === player.user_id && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        {currentRoom.creator_id === user.id && player.user_id !== user.id && (
                          <Button
                            onClick={() => kickPlayer(player.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-400/20 text-red-400 hover:bg-red-600/20"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <h3 className="text-white font-semibold mb-2">Game Settings</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Undercover:</span>
                        <div className="text-white font-medium">{currentRoom.settings.undercover_count}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Blank:</span>
                        <div className="text-white font-medium">{currentRoom.settings.blank_count}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Max Players:</span>
                        <div className="text-white font-medium">{currentRoom.settings.max_players}</div>
                      </div>
                    </div>
                  </div>

                  {currentRoom.creator_id === user.id && (
                    <Button 
                      onClick={startGame}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={roomPlayers.length < 3}
                    >
                      Start Game ({roomPlayers.length} players)
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {showChat && (
              <div className="lg:col-span-1">
                <RoomChat roomId={currentRoom.id} user={user} />
              </div>
            )}
          </div>

          {showSettings && (
            <RoomSettings
              settings={currentRoom.settings}
              onSave={updateRoomSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🕵️ Undercover
          </h1>
          <p className="text-purple-200">
            Join or create a room to start playing!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roomName" className="text-white">Room Name</Label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <Button 
                onClick={createRoom}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={loading || !newRoomName.trim()}
              >
                Create Room
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="roomCode" className="text-white">Room Code</Label>
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={() => joinRoom(roomCode)}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || !roomCode.trim()}
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>

        {rooms.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Available Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">{room.name}</h3>
                    <div className="text-white/70 text-sm mb-3">
                      Code: {room.code}
                    </div>
                    <Button
                      onClick={() => joinRoom(room.code)}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
