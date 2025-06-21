
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Auth from '@/components/Auth';
import RoomLobby from '@/components/RoomLobby';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestDisplayName, setGuestDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

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
    console.log('Starting game:', { roomId, players, settings });
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room');
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
      <div className="absolute top-4 right-4">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
      
      <RoomLobby 
        user={user}
        isGuest={isGuest}
        displayName={guestDisplayName}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
};

export default Index;
