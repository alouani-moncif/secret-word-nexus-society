
-- Create rooms table for multiplayer functionality
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  creator_id UUID REFERENCES auth.users NOT NULL,
  settings JSONB DEFAULT '{"undercover_count": 1, "blank_count": 0, "max_players": 10}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_players table to track who's in each room
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create chat_messages table for in-room chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_sessions table to track active games
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms ON DELETE CASCADE NOT NULL,
  game_state JSONB NOT NULL,
  current_phase TEXT DEFAULT 'setup',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Anyone can view active rooms" ON public.rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Creators can manage their rooms" ON public.rooms FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies for room_players
CREATE POLICY "Players can view room members" ON public.room_players FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = room_players.room_id AND rp.user_id = auth.uid())
);
CREATE POLICY "Users can join rooms" ON public.room_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own player info" ON public.room_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Room creators can manage players" ON public.room_players FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_players.room_id AND r.creator_id = auth.uid())
);

-- RLS Policies for chat_messages
CREATE POLICY "Room members can view chat" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = chat_messages.room_id AND rp.user_id = auth.uid())
);
CREATE POLICY "Room members can send messages" ON public.chat_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = chat_messages.room_id AND rp.user_id = auth.uid())
);

-- RLS Policies for game_sessions
CREATE POLICY "Room members can view game sessions" ON public.game_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_players rp WHERE rp.room_id = game_sessions.room_id AND rp.user_id = auth.uid())
);
CREATE POLICY "Room creators can manage game sessions" ON public.game_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = game_sessions.room_id AND r.creator_id = auth.uid())
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Set replica identity for realtime updates
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
