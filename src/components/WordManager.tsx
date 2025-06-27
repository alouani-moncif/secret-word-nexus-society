
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Database, Trash2 } from 'lucide-react';
import { addWordPair, initializeSampleWords, purgeAllWords } from '@/lib/gameWords';
import { useToast } from '@/hooks/use-toast';
import WordImporter from './WordImporter';

const WordManager: React.FC = () => {
  const { toast } = useToast();
  const [civilianWord, setCivilianWord] = useState('');
  const [undercoverWord, setUndercoverWord] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPurgeButton, setShowPurgeButton] = useState(false);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!civilianWord.trim() || !undercoverWord.trim() || !category.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await addWordPair({
        civilian_word: civilianWord.trim(),
        undercover_word: undercoverWord.trim(),
        difficulty,
        category: category.trim()
      });

      toast({
        title: "Word pair added!",
        description: `"${civilianWord}" vs "${undercoverWord}" has been added to the database.`,
      });

      // Clear form
      setCivilianWord('');
      setUndercoverWord('');
      setCategory('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add word pair",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSample = async () => {
    setLoading(true);
    try {
      await initializeSampleWords();
      toast({
        title: "Sample words initialized!",
        description: "The database has been populated with sample word pairs.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize sample words",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeWords = async () => {
    if (!window.confirm('Are you sure you want to delete ALL word pairs? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      await purgeAllWords();
      toast({
        title: "All words purged!",
        description: "All word pairs have been deleted from the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purge words",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            Word Database Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              Add word pairs to the database for the Undercover game. The civilian word is what most players get, 
              and the undercover word is what undercover agents get.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleInitializeSample} 
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              Initialize Sample Words
            </Button>
            
            <Button 
              onClick={() => setShowPurgeButton(!showPurgeButton)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-600/20"
              disabled={loading}
            >
              Advanced Options
            </Button>
            
            {showPurgeButton && (
              <Button 
                onClick={handlePurgeWords}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/20"
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Purge All Words
              </Button>
            )}
          </div>

          <form onSubmit={handleAddWord} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="civilian" className="text-white">Civilian Word</Label>
                <Input
                  id="civilian"
                  value={civilianWord}
                  onChange={(e) => setCivilianWord(e.target.value)}
                  placeholder="e.g., Apple"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <Label htmlFor="undercover" className="text-white">Undercover Word</Label>
                <Input
                  id="undercover"
                  value={undercoverWord}
                  onChange={(e) => setUndercoverWord(e.target.value)}
                  placeholder="e.g., Orange"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., fruits"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Word Pair
            </Button>
          </form>
        </CardContent>
      </Card>

      <WordImporter />
    </div>
  );
};

export default WordManager;
