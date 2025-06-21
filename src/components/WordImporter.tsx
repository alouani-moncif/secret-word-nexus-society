
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Download } from 'lucide-react';
import { addWordPair } from '@/lib/gameWords';
import { useToast } from '@/hooks/use-toast';

interface ImportedWordPair {
  civilian_word: string;
  undercover_word: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const WordImporter: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const validateWordPair = (pair: any): pair is ImportedWordPair => {
    return (
      typeof pair.civilian_word === 'string' &&
      typeof pair.undercover_word === 'string' &&
      ['easy', 'medium', 'hard'].includes(pair.difficulty) &&
      typeof pair.category === 'string'
    );
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      toast({
        title: "No data",
        description: "Please upload a file or paste JSON data",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const data = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        throw new Error("JSON must be an array of word pairs");
      }

      let successCount = 0;
      let errorCount = 0;

      for (const pair of data) {
        try {
          if (validateWordPair(pair)) {
            await addWordPair({
              civilian_word: pair.civilian_word.trim(),
              undercover_word: pair.undercover_word.trim(),
              difficulty: pair.difficulty,
              category: pair.category.trim()
            });
            successCount++;
          } else {
            errorCount++;
            console.warn('Invalid word pair:', pair);
          }
        } catch (error) {
          errorCount++;
          console.error('Error adding word pair:', pair, error);
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} word pairs. ${errorCount} errors.`,
      });

      if (successCount > 0) {
        setJsonText('');
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid JSON format. Please check your file.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleFormat = () => {
    const sampleData = [
      {
        civilian_word: "Apple",
        undercover_word: "Orange",
        difficulty: "easy",
        category: "food"
      },
      {
        civilian_word: "Dog",
        undercover_word: "Cat",
        difficulty: "easy",
        category: "animals"
      },
      {
        civilian_word: "Mountain",
        undercover_word: "Hill",
        difficulty: "medium",
        category: "nature"
      }
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-pairs-sample.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Word Pairs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
          <p className="text-blue-200 text-sm mb-3">
            Import multiple word pairs from a JSON file. The file should contain an array of objects with the following structure:
          </p>
          <Button 
            onClick={downloadSampleFormat}
            variant="outline"
            size="sm"
            className="border-blue-400/30 text-blue-200 hover:bg-blue-600/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample Format
          </Button>
        </div>

        <div>
          <Label htmlFor="file-upload" className="text-white">Upload JSON File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".json,.txt"
            onChange={handleFileUpload}
            className="bg-white/10 border-white/20 text-white file:bg-white/20 file:text-white file:border-0"
          />
        </div>

        <div>
          <Label htmlFor="json-text" className="text-white">Or Paste JSON Data</Label>
          <Textarea
            id="json-text"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste your JSON data here..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[200px]"
          />
        </div>

        <Button 
          onClick={handleImport}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={loading || !jsonText.trim()}
        >
          <FileText className="w-4 h-4 mr-2" />
          {loading ? 'Importing...' : 'Import Word Pairs'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WordImporter;
