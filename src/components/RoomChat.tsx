
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  player_name: string;
  message: string;
  created_at: any;
  user_id: string;
}

interface RoomChatProps {
  roomId: string;
  user: any;
}

const RoomChat: React.FC<RoomChatProps> = ({ roomId, user }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('room_id', '==', roomId),
      orderBy('created_at', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        room_id: roomId,
        user_id: user.uid,
        player_name: user.displayName || user.email || 'Player',
        message: newMessage.trim(),
        created_at: serverTimestamp()
      });

      setNewMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 h-96 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-sm">
          <MessageCircle className="w-4 h-4" />
          Room Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-3">
        <div className="flex-1 overflow-y-auto space-y-2 max-h-64">
          {messages.map(message => (
            <div key={message.id} className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">
                  {message.player_name}
                </span>
                <span className="text-white/50 text-xs">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="text-white/90 text-sm break-words">
                {message.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm"
            maxLength={200}
          />
          <Button
            type="submit"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RoomChat;
