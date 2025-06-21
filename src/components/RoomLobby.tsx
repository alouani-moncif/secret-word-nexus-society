import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, LogIn, Settings, MessageSquare, Crown, X } from 'lucide-react';
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
  is_active: boolean;
}

interface RoomPlayer {
  id: string;
  player_name: string;
  user_id: string;
  is_ready: boolean;
  joined_at: string;
}

interface RoomLobbyProps {
  user: any;
  isGuest?: boolean;
  displayName?: string;
  onStartGame: (roomId: string, players: RoomPlayer[], settings: RoomSettings) => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ 
  user, 
  isGuest = false, 
  displayName = '', 
  onStartGame, 
  onLeaveRoom 
}) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    if (isGuest) {
      // Guests can't see all rooms, only join by code
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedRooms = (data || []).map(room => ({
        ...room,
        settings: (room.settings as unknown) as RoomSettings
      }));
      setRooms(typedRooms);
    } catch (error: any) {
      toast({
        title: "Error loading rooms",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    if (isGuest) {
      toast({
        title: "Guest Limitation",
        description: "Guests cannot create rooms. Please sign up for an account to create rooms.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName,
          code: roomCode,
          creator_id: user.id,
          settings: {
            undercover_count: 1,
            blank_count: 0,
            max_players: 10
          }
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const typedRoom = {
        ...roomData,
        settings: (roomData.settings as unknown) as RoomSettings
      };
      setCurrentRoom(typedRoom);
      setNewRoomName('');
      
      await joinRoomAsPlayer(typedRoom.id);
      
      toast({
        title: "Room created!",
        description: `Room code: ${roomCode}`,
      });
    } catch (error: any) {
      toast({
        title: "Error creating room",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      // Check if room is full
      const { data: playersCount, error: playersError } = await supabase
        .from('room_players')
        .select('id')
        .eq('room_id', roomData.id);

      const settings = (roomData.settings as unknown) as RoomSettings;
      if (playersCount && playersCount.length >= settings.max_players) {
        throw new Error('Room is full');
      }

      const typedRoom = {
        ...roomData,
        settings: (roomData.settings as unknown) as RoomSettings
      };
      setCurrentRoom(typedRoom);
      
      await joinRoomAsPlayer(roomData.id);
    } catch (error: any) {
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRoomByCode = async () => {
    if (!roomCode.trim()) return;
    
    setLoading(true);
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .eq('is_active', true)
        .single();

    if (roomError) throw roomError;

    const typedRoom = {
      ...roomData,
      settings: (roomData.settings as unknown) as RoomSettings
    };
    setCurrentRoom(typedRoom);
    setRoomCode('');
    
    await joinRoomAsPlayer(roomData.id);
  } catch (error: any) {
    toast({
      title: "Error joining room",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  };

  const joinRoomAsPlayer = async (roomId: string) => {
    try {
      const playerName = isGuest ? displayName : (user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Player');
      const userId = isGuest ? `guest_${user.id}` : user.id;

      const { error } = await supabase
        .from('room_players')
        .insert({
          room_id: roomId,
          user_id: userId,
          player_name: playerName,
          is_ready: false
        });

      if (error) throw error;
      
      await loadRoomPlayers(roomId);
    } catch (error: any) {
      if (!error.message.includes('duplicate')) {
        toast({
          title: "Error joining room",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const loadRoomPlayers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setRoomPlayers(data || []);
    } catch (error: any) {
      console.error('Error loading players:', error);
    }
  };

  const updateSettings = async (settings: RoomSettings) => {
    if (!currentRoom) return;
    
    try {
      await supabase
        .from('rooms')
        .update({ settings: settings as any })
        .eq('id', currentRoom.id);

      setCurrentRoom({ ...currentRoom, settings });
      setShowSettings(false);
      
      toast({
        title: "Settings updated",
        description: "Room settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleReady = async () => {
    if (!currentRoom) return;
    
    try {
      const userId = isGuest ? `guest_${user.id}` : user.id;
      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: !isReady })
        .eq('room_id', currentRoom.id)
        .eq('user_id', userId);

      if (error) throw error;
      
      setIsReady(!isReady);
      await loadRoomPlayers(currentRoom.id);
    } catch (error: any) {
      toast({
        title: "Error updating ready status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const kickPlayer = async (playerId: string) => {
    if (!currentRoom || currentRoom.creator_id !== user.id) return;
    
    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;
      
      await loadRoomPlayers(currentRoom.id);
      
      toast({
        title: "Player kicked",
        description: "Player has been removed from the room.",
      });
    } catch (error: any) {
      toast({
        title: "Error kicking player",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startGame = async () => {
    if (!currentRoom || currentRoom.creator_id !== user.id) return;
    
    const readyPlayers = roomPlayers.filter(p => p.is_ready);
    if (readyPlayers.length < 3) {
      toast({
        title: "Not enough players",
        description: "At least 3 ready players are required to start the game.",
        variant: "destructive"
      });
      return;
    }
    
    onStartGame(currentRoom.id, readyPlayers, currentRoom.settings);
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      const userId = isGuest ? `guest_${user.id}` : user.id;
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('user_id', userId);

      if (error) throw error;
      
      setCurrentRoom(null);
      setRoomPlayers([]);
      setIsReady(false);
      onLeaveRoom();
    } catch (error: any) {
      toast({
        title: "Error leaving room",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getUserId = () => isGuest ? `guest_${user.id}` : user.id;
  const isCreator = currentRoom && currentRoom.creator_id === user.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ Undercover</h1>
          <p className="text-purple-200">Join or create a game room</p>
          {isGuest && (
            <div className="mt-2">
              <Badge variant="secondary" className="bg-yellow-600 text-white">
                Playing as Guest: {displayName}
              </Badge>
            </div>
          )}
        </div>

        {!currentRoom ? (
          <div className="grid gap-6 md:grid-cols-2">
            {!isGuest && (
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
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    Create Room
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Join Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomCode" className="text-white">Room Code</Label>
                  <Input
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter room code"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <Button 
                  onClick={joinRoomByCode} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  Join Room
                </Button>
              </CardContent>
            </Card>

            {!isGuest && rooms.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Available Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {rooms.map(room => (
                      <div key={room.id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-medium">{room.name}</h3>
                          <p className="text-white/70 text-sm">Code: {room.code}</p>
                        </div>
                        <Button 
                          onClick={() => joinRoom(room.id)} 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
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
        ) : (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {currentRoom.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {currentRoom.code}
                    </Badge>
                    {isCreator && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSettings(true)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChat(true)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={leaveRoom}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      Leave
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Game Settings</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Max Players:</span>
                        <span className="text-white ml-2">{currentRoom.settings.max_players}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Undercover:</span>
                        <span className="text-white ml-2">{currentRoom.settings.undercover_count}</span>
                      </div>
                      <div>
                        <span className="text-white/70">Blank:</span>
                        <span className="text-white ml-2">{currentRoom.settings.blank_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-3">
                      Players ({roomPlayers.length}/{currentRoom.settings.max_players})
                    </h3>
                    <div className="grid gap-2">
                      {roomPlayers.map(player => (
                        <div key={player.id} className="flex items-center justify-between bg-white/5 rounded p-2">
                          <div className="flex items-center gap-2">
                            {player.user_id === currentRoom.creator_id && (
                              <Crown className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className="text-white">{player.player_name}</span>
                            {player.is_ready && (
                              <Badge variant="default" className="bg-green-600 text-white">
                                Ready
                              </Badge>
                            )}
                          </div>
                          {isCreator && player.user_id !== currentRoom.creator_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => kickPlayer(player.id)}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button
                    onClick={toggleReady}
                    className={`w-full ${isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    {isReady ? 'Ready!' : 'Mark as Ready'}
                  </Button>
                  
                  {isCreator && (
                    <Button
                      onClick={startGame}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={roomPlayers.filter(p => p.is_ready).length < 3}
                    >
                      Start Game
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {showSettings && isCreator && (
              <RoomSettings
                settings={currentRoom.settings}
                onSave={updateSettings}
                onClose={() => setShowSettings(false)}
              />
            )}

            {showChat && (
              <RoomChat
                roomId={currentRoom.id}
                user={user}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
