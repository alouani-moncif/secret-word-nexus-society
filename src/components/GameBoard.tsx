
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, MessageCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { useGameState } from '@/hooks/useGameState';
import { getRandomWordPair, initializeSampleWords } from '@/lib/gameWords';
import { doc, updateDoc } from 'firebase/firestore';
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

interface GameBoardProps {
  roomId: string;
  players: Player[];
  settings: {
    undercover_count: number;
    blank_count: number;
    max_players: number;
    word_difficulty?: string;
  };
  user: User;
  onGameEnd: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  roomId, 
  players: initialPlayers, 
  settings, 
  user, 
  onGameEnd 
}) => {
  const { toast } = useToast();
  const { gameState, loading, updateGameState } = useGameState(roomId);
  const [currentPlayerData, setCurrentPlayerData] = useState<Player | null>(null);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);

  const userId = user.uid.startsWith('guest_') ? user.uid : user.uid;
  const currentPlayer = players.find(p => p.user_id === userId);

  useEffect(() => {
    if (!gameState) {
      initializeGame();
    } else if (gameState.players) {
      setPlayers(gameState.players);
      const myPlayerData = gameState.players.find((p: Player) => p.user_id === userId);
      setCurrentPlayerData(myPlayerData || null);
    }
  }, [gameState]);

  const initializeGame = async () => {
    try {
      // Get word pair, if none exists, initialize sample words first
      let wordPair = await getRandomWordPair(settings.word_difficulty);
      
      if (!wordPair) {
        console.log('No word pairs found, initializing sample words...');
        await initializeSampleWords();
        wordPair = await getRandomWordPair(settings.word_difficulty);
        
        if (!wordPair) {
          toast({
            title: "Error",
            description: "Could not load word pair even after initialization. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Distribute roles
      const playersWithRoles = distributeRoles(initialPlayers, settings);
      
      // Assign words based on roles
      const playersWithWords = playersWithRoles.map(player => ({
        ...player,
        word: player.role === 'civilian' ? wordPair.civilian_word :
              player.role === 'undercover' ? wordPair.undercover_word : 
              undefined // blank players get no word
      }));

      // Update game state
      await updateGameState({
        status: 'word_reveal',
        civilian_word: wordPair.civilian_word,
        undercover_word: wordPair.undercover_word,
        players: playersWithWords,
        current_phase: 'Word Reveal Phase'
      });

      console.log('Game initialized with roles:', playersWithWords.map(p => ({ name: p.player_name, role: p.role, word: p.word })));
      
    } catch (error) {
      console.error('Error initializing game:', error);
      toast({
        title: "Error starting game",
        description: "Could not initialize the game. Please try again.",
        variant: "destructive"
      });
    }
  };

  const distributeRoles = (players: Player[], settings: { undercover_count: number; blank_count: number }) => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const totalPlayers = shuffledPlayers.length;
    const undercover_count = Math.min(settings.undercover_count, totalPlayers - 1);
    const blank_count = Math.min(settings.blank_count, totalPlayers - undercover_count - 1);
    const civilian_count = totalPlayers - undercover_count - blank_count;

    console.log(`Distributing roles: ${civilian_count} civilians, ${undercover_count} undercover, ${blank_count} blank`);

    return shuffledPlayers.map((player, index) => ({
      ...player,
      role: index < undercover_count ? 'undercover' as const :
            index < undercover_count + blank_count ? 'blank' as const :
            'civilian' as const
    }));
  };

  const toggleWordReveal = () => {
    setWordRevealed(!wordRevealed);
  };

  const confirmWordSeen = async () => {
    try {
      // Mark this player as having seen their word
      const updatedPlayersWithWords = [...(gameState?.players_with_words || [])];
      if (!updatedPlayersWithWords.includes(userId)) {
        updatedPlayersWithWords.push(userId);
      }

      await updateGameState({
        players_with_words: updatedPlayersWithWords
      });

      // Check if all players have seen their words
      if (updatedPlayersWithWords.length === players.length) {
        await updateGameState({
          status: 'discussion',
          current_phase: 'Discussion Phase - Find the undercover agents!'
        });
      }

    } catch (error) {
      console.error('Error confirming word seen:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'civilian': return 'Civilian';
      case 'undercover': return 'Undercover Agent';
      case 'blank': return 'Mr. Blank';
      default: return 'Unknown';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'civilian': return 'bg-blue-600';
      case 'undercover': return 'bg-red-600';
      case 'blank': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading || !gameState) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="pt-6">
            <div className="text-center text-white">
              <p>Loading your game data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPlayerData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="pt-6">
            <div className="text-center text-white">
              <p>Loading your game data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center">
            🕵️ Undercover Game - Room: {roomId}
          </CardTitle>
          <div className="text-center">
            <Badge className={`${getRoleBadgeColor(currentPlayerData.role || '')} text-white`}>
              You are: {getRoleDisplayName(currentPlayerData.role || '')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {gameState.status === 'word_reveal' && (
              <div className="bg-white/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Your Secret Information
                </h2>
                <p className="text-white/80 mb-4">
                  This is your word for this round. Keep it secret!
                </p>
                
                <div className="space-y-4">
                  <Button
                    onClick={toggleWordReveal}
                    className={`w-full h-20 text-xl font-bold ${
                      wordRevealed
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {wordRevealed ? (
                      <>
                        <EyeOff className="w-6 h-6 mr-2" />
                        Hide Word
                      </>
                    ) : (
                      <>
                        <Eye className="w-6 h-6 mr-2" />
                        Reveal My Word
                      </>
                    )}
                  </Button>

                  {wordRevealed && (
                    <div className="bg-white/10 rounded-lg p-4 animate-scale-in">
                      <div className="text-3xl font-bold text-white mb-2">
                        {currentPlayerData.word || "You have no word!"}
                      </div>
                      {!currentPlayerData.word && (
                        <Badge variant="secondary" className="text-sm">
                          You are the BLANK player - you must guess the word!
                        </Badge>
                      )}
                      <p className="text-white/70 text-sm mt-2">
                        {currentPlayerData.role === 'blank' ? 
                          'Try to figure out what word the others are talking about!' :
                          'Remember this word and use it in the discussion!'
                        }
                      </p>
                      
                      <Button
                        onClick={confirmWordSeen}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                        disabled={gameState.players_with_words?.includes(userId)}
                      >
                        {gameState.players_with_words?.includes(userId) ? 
                          'Word Confirmed ✓' : 
                          'I\'ve Memorized My Word'
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {gameState.status === 'discussion' && (
              <div className="bg-white/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Discussion Phase
                </h2>
                <p className="text-white/80 mb-4">
                  Discuss and find the undercover agents! Be careful not to reveal your word directly.
                </p>
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-white/60 mx-auto mb-2" />
                  <p className="text-white/60">Start discussing with other players!</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-white/60 text-sm">
              <span>Status: {gameState.current_phase}</span>
              <span>{gameState.players_with_words?.length || 0}/{players.length} players ready</span>
            </div>

            <Button
              onClick={onGameEnd}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Leave Game
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardContent className="pt-6">
          <h3 className="text-white font-semibold mb-3">Players in this game:</h3>
          <div className="grid grid-cols-1 gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-lg bg-white/10 flex justify-between items-center"
              >
                <span className="text-white">{player.player_name}</span>
                <div className="flex items-center gap-2">
                  {gameState.players_with_words?.includes(player.user_id) && (
                    <Badge variant="secondary" className="bg-green-600/20 text-green-300 text-xs">
                      Ready ✓
                    </Badge>
                  )}
                  <Badge className={`${getRoleBadgeColor(player.role || '')} text-white text-xs`}>
                    {getRoleDisplayName(player.role || '')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameBoard;
