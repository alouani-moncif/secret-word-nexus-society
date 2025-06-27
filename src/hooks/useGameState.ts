
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  player_name: string;
  user_id: string;
  word?: string;
  role?: 'civilian' | 'undercover' | 'blank';
  is_ready: boolean;
}

interface GameState {
  status: 'starting' | 'word_reveal' | 'discussion' | 'voting' | 'ended';
  current_phase: string;
  civilian_word?: string;
  undercover_word?: string;
  players: Player[];
  players_with_words: string[];
  creator_id: string;
  settings: any;
}

export const useGameState = (roomId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    console.log('Setting up game state listener for room:', roomId);
    const gameRef = doc(db, 'games', roomId);
    
    const unsubscribe = onSnapshot(
      gameRef,
      (doc) => {
        console.log('Game document snapshot received:', doc.exists(), doc.data());
        
        if (doc.exists()) {
          const data = doc.data() as GameState;
          setGameState(data);
        } else {
          console.log('Game document does not exist');
          setGameState(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to game state:', error);
        toast({
          title: "Connection Error",
          description: "Lost connection to game. Please refresh.",
          variant: "destructive"
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, toast]);

  const updateGameState = async (updates: Partial<GameState>) => {
    if (!roomId) return;
    
    try {
      const gameRef = doc(db, 'games', roomId);
      await updateDoc(gameRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      console.log('Game state updated:', updates);
    } catch (error) {
      console.error('Error updating game state:', error);
      toast({
        title: "Error",
        description: "Failed to update game state",
        variant: "destructive"
      });
    }
  };

  return {
    gameState,
    loading,
    updateGameState
  };
};
