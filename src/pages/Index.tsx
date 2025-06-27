
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import RoomLobby from '@/components/RoomLobby';
import GameBoard from '@/components/GameBoard';
import WordManager from '@/components/WordManager';
import { Button } from '@/components/ui/button';
import { LogOut, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppView = 'lobby' | 'game' | 'wordManager';

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestDisplayName, setGuestDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('lobby');
  const [gameData, setGameData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setIsGuest(false);
    setGuestDisplayName('');
  };

  const handleGuestLogin = (displayName: string) => {
    setIsGuest(true);
    setGuestDisplayName(displayName);
    setUser({ 
      uid: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: null,
      displayName: displayName,
      emailVerified: false,
      isAnonymous: true
    } as User);
  };

  const handleSignOut = async () => {
    try {
      if (!isGuest) {
        await signOut(auth);
      } else {
        setUser(null);
        setIsGuest(false);
        setGuestDisplayName('');
      }
      
      setCurrentView('lobby');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStartGame = (roomId: string, players: any[], settings: any) => {
    console.log('Starting game in Index:', { roomId, players, settings });
    setGameData({ roomId, players, settings });
    setCurrentView('game');
    
    toast({
      title: "Game Starting!",
      description: `Starting game with ${players.length} players`,
    });
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room');
    setCurrentView('lobby');
    setGameData(null);
  };

  const handleBackToLobby = () => {
    setCurrentView('lobby');
    setGameData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth 
        onAuthSuccess={handleAuthSuccess}
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          onClick={() => setCurrentView(currentView === 'wordManager' ? 'lobby' : 'wordManager')}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Database className="w-4 h-4 mr-2" />
          {currentView === 'wordManager' ? 'Back to Game' : 'Word Manager'}
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
      
      {currentView === 'lobby' && (
        <RoomLobby 
          user={user}
          isGuest={isGuest}
          displayName={guestDisplayName}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {currentView === 'game' && gameData && (
        <GameBoard
          roomId={gameData.roomId}
          players={gameData.players}
          settings={gameData.settings}
          user={user}
          onGameEnd={handleBackToLobby}
        />
      )}

      {currentView === 'wordManager' && (
        <WordManager />
      )}
    </div>
  );
};

export default Index;
