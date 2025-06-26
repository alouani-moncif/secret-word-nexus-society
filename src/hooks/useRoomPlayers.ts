import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface RoomPlayer {
  id: string;
  player_name: string;
  user_id: string;
  is_ready: boolean;
  joined_at: any;
}

export const useRoomPlayers = (roomId: string | null, user: any, isGuest: boolean, displayName: string) => {
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) {
      setRoomPlayers([]);
      setIsReady(false);
      return;
    }

    console.log('Setting up real-time listener for room players:', roomId);
    
    const playersQuery = query(
      collection(db, 'room_players'),
      where('room_id', '==', roomId),
      orderBy('joined_at', 'asc')
    );

    const unsubscribe = onSnapshot(
      playersQuery, 
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RoomPlayer[];
        
        console.log('Players updated in hook:', playersData);
        setRoomPlayers(playersData);
        
        // Update ready status for current user
        const userId = isGuest ? `guest_${user.uid}` : user.uid;
        const currentPlayer = playersData.find(p => p.user_id === userId);
        if (currentPlayer) {
          setIsReady(currentPlayer.is_ready);
        }
      }, 
      (error) => {
        console.error('Error listening to room players:', error);
        
        // Check if it's a missing index error
        if (error.code === 'failed-precondition') {
          toast({
            title: "Database setup required",
            description: "Please create the required Firestore indexes. Check the console for details.",
            variant: "destructive"
          });
          console.error('Firestore index required for room_players collection. Please create composite indexes for:');
          console.error('1. room_id (Ascending) + joined_at (Ascending)');
          console.error('2. room_id (Ascending) + user_id (Ascending)');
        } else {
          toast({
            title: "Connection error",
            description: "Lost connection to room players. Please refresh.",
            variant: "destructive"
          });
        }
      }
    );

    return () => unsubscribe();
  }, [roomId, user?.uid, isGuest, toast]);

  const joinRoomAsPlayer = async (roomId: string) => {
    try {
      const playerName = isGuest ? displayName : (user?.displayName || user?.email?.split('@')[0] || 'Player');
      const userId = isGuest ? `guest_${user.uid}` : user.uid;

      console.log('Attempting to join room with userId:', userId, 'playerName:', playerName);

      const existingPlayerQuery = query(
        collection(db, 'room_players'),
        where('room_id', '==', roomId),
        where('user_id', '==', userId)
      );
      
      const existingPlayerSnapshot = await getDocs(existingPlayerQuery);
      
      if (existingPlayerSnapshot.empty) {
        const playerData = {
          room_id: roomId,
          user_id: userId,
          player_name: playerName,
          is_ready: false,
          joined_at: serverTimestamp()
        };

        await addDoc(collection(db, 'room_players'), playerData);
        console.log('Player added to room:', playerData);
      } else {
        console.log('Player already in room');
      }
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error joining room",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleReady = async () => {
    if (!roomId) return;
    
    try {
      const userId = isGuest ? `guest_${user.uid}` : user.uid;
      const playerQuery = query(
        collection(db, 'room_players'),
        where('room_id', '==', roomId),
        where('user_id', '==', userId)
      );
      
      const playerSnapshot = await getDocs(playerQuery);
      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        const playerRef = doc(db, 'room_players', playerDoc.id);
        await updateDoc(playerRef, { is_ready: !isReady });
        
        console.log('Updated ready status for player:', userId, 'to:', !isReady);
      }
    } catch (error: any) {
      console.error('Error updating ready status:', error);
      toast({
        title: "Error updating ready status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const kickPlayer = async (playerId: string) => {
    try {
      const playerRef = doc(db, 'room_players', playerId);
      await deleteDoc(playerRef);
      
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

  const leaveRoom = async () => {
    if (!roomId) return;
    
    try {
      const userId = isGuest ? `guest_${user.uid}` : user.uid;
      const playerQuery = query(
        collection(db, 'room_players'),
        where('room_id', '==', roomId),
        where('user_id', '==', userId)
      );
      
      const playerSnapshot = await getDocs(playerQuery);
      if (!playerSnapshot.empty) {
        const playerDoc = playerSnapshot.docs[0];
        const playerRef = doc(db, 'room_players', playerDoc.id);
        await deleteDoc(playerRef);
      }
    } catch (error: any) {
      toast({
        title: "Error leaving room",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    roomPlayers,
    isReady,
    joinRoomAsPlayer,
    toggleReady,
    kickPlayer,
    leaveRoom
  };
};
