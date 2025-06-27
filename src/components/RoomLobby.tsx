import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, LogIn, Settings, MessageSquare } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRoomPlayers } from '@/hooks/useRoomPlayers';
import RoomSettings from './RoomSettings';
import RoomChat from './RoomChat';
import RoomPlayersList from './RoomPlayersList';

interface RoomSettings {
  undercover_count: number;
  blank_count: number;
  max_players: number;
  word_difficulty?: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
  creator_id: string;
  settings: RoomSettings;
  is_active: boolean;
  created_at: any;
}

interface RoomPlayer {
  id: string;
  player_name: string;
  user_id: string;
  is_ready: boolean;
  joined_at: any;
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
  const [newRoomName, setNewRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    roomPlayers,
    isReady,
    joinRoomAsPlayer,
    toggleReady,
    kickPlayer,
    leaveRoom: leaveRoomPlayers
  } = useRoomPlayers(currentRoom?.id || null, user, isGuest, displayName);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('is_active', '==', true),
        orderBy('created_at', 'desc')
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Room[];
      
      setRooms(roomsData);
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      toast({
        title: "Error loading rooms",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    setLoading(true);
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData = {
        name: newRoomName,
        code: roomCode,
        creator_id: user.uid,
        settings: {
          undercover_count: 1,
          blank_count: 0,
          max_players: 10,
          word_difficulty: 'any'
        },
        is_active: true,
        created_at: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      const newRoom = {
        id: docRef.id,
        ...roomData,
        created_at: new Date()
      } as Room;
      
      setCurrentRoom(newRoom);
      setNewRoomName('');
      
      await joinRoomAsPlayer(docRef.id);
      
      toast({
        title: "Room created!",
        description: `Room code: ${roomCode}`,
      });
    } catch (error: any) {
      console.error('Error creating room:', error);
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
      const roomDoc = await getDocs(query(collection(db, 'rooms'), where('__name__', '==', roomId)));
      if (roomDoc.empty) throw new Error('Room not found');
      
      const roomData = { id: roomDoc.docs[0].id, ...roomDoc.docs[0].data() } as Room;
      
      const playersQuery = query(collection(db, 'room_players'), where('room_id', '==', roomData.id));
      const playersSnapshot = await getDocs(playersQuery);
      
      if (playersSnapshot.size >= roomData.settings.max_players) {
        throw new Error('Room is full');
      }

      setCurrentRoom(roomData);
      await joinRoomAsPlayer(roomData.id);
    } catch (error: any) {
      console.error('Error joining room:', error);
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
      const roomQuery = query(
        collection(db, 'rooms'),
        where('code', '==', roomCode.toUpperCase()),
        where('is_active', '==', true)
      );
      
      const roomSnapshot = await getDocs(roomQuery);
      if (roomSnapshot.empty) throw new Error('Room not found');
      
      const roomDoc = roomSnapshot.docs[0];
      const roomData = { id: roomDoc.id, ...roomDoc.data() } as Room;
      
      setCurrentRoom(roomData);
      setRoomCode('');
      
      await joinRoomAsPlayer(roomData.id);
    } catch (error: any) {
      console.error('Error joining room by code:', error);
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settings: RoomSettings) => {
    if (!currentRoom) return;
    
    try {
      const roomRef = doc(db, 'rooms', currentRoom.id);
      await updateDoc(roomRef, { settings });

      setCurrentRoom({ ...currentRoom, settings });
      setShowSettings(false);
      
      toast({
        title: "Settings updated",
        description: "Room settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startGame = async () => {
    if (!currentRoom || currentRoom.creator_id !== user.uid) {
      console.log('Not authorized to start game or no room');
      return;
    }
    
    const readyPlayers = roomPlayers.filter(p => p.is_ready);
    console.log('Ready players:', readyPlayers.length, 'Total players:', roomPlayers.length);
    
    if (readyPlayers.length < 3) {
      toast({
        title: "Not enough players",
        description: "At least 3 ready players are required to start the game.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create game document in database using setDoc instead of updateDoc
      const gameRef = doc(db, 'games', currentRoom.id);
      await setDoc(gameRef, {
        status: 'starting',
        players: readyPlayers,
        settings: currentRoom.settings,
        created_at: serverTimestamp(),
        creator_id: user.uid
      });

      console.log('Game document created, starting game with:', { roomId: currentRoom.id, players: readyPlayers, settings: currentRoom.settings });
      onStartGame(currentRoom.id, readyPlayers, currentRoom.settings);
      
      toast({
        title: "Game Started!",
        description: `Game starting with ${readyPlayers.length} players`,
      });
      
    } catch (error: any) {
      console.error('Error starting game:', error);
      toast({
        title: "Error starting game",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      await leaveRoomPlayers();
      setCurrentRoom(null);
      onLeaveRoom();
    } catch (error: any) {
      console.error('Error leaving room:', error);
      // Continue with leaving even if there's an error
      setCurrentRoom(null);
      onLeaveRoom();
    }
  };

  const isCreator = currentRoom && currentRoom.creator_id === user.uid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🕵️ Undercover</h1>
          <p className="text-purple-200">Join or create a game room</p>
          <p className="text-purple-300 text-sm mt-1">Created by Moncif for Cap family ❤️</p>
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
            {/* Create Room */}
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
                {isGuest && (
                  <p className="text-white/70 text-sm">
                    Guests can create rooms too! 🎉
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Join Room */}
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

            {/* Available Rooms */}
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
                          className="border-white/40 text-white hover:bg-white/20 hover:border-white/60"
                        >
                          <Settings className="w-4 h-4 text-white fill-white" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowChat(true)}
                          className="border-white/40 text-white hover:bg-white/20 hover:border-white/60"
                        >
                          <MessageSquare className="w-4 h-4 text-white fill-white" />
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                      <div>
                        <span className="text-white/70">Difficulty:</span>
                        <span className="text-white ml-2">{currentRoom.settings.word_difficulty || 'Any'}</span>
                      </div>
                    </div>
                  </div>

                  <RoomPlayersList
                    players={roomPlayers}
                    maxPlayers={currentRoom.settings.max_players}
                    isCreator={!!isCreator}
                    creatorId={currentRoom.creator_id}
                    onKickPlayer={kickPlayer}
                  />
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
                      Start Game ({roomPlayers.filter(p => p.is_ready).length} ready)
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
