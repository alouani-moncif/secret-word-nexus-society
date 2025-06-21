
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface WordPair {
  id?: string;
  civilian_word: string;
  undercover_word: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  created_at?: any;
}

// Sample word pairs for the game
export const sampleWordPairs: Omit<WordPair, 'id' | 'created_at'>[] = [
  {
    civilian_word: "Apple",
    undercover_word: "Orange",
    difficulty: "easy",
    category: "fruits"
  },
  {
    civilian_word: "Dog",
    undercover_word: "Cat",
    difficulty: "easy",
    category: "animals"
  },
  {
    civilian_word: "Car",
    undercover_word: "Bike",
    difficulty: "easy",
    category: "vehicles"
  },
  {
    civilian_word: "Coffee",
    undercover_word: "Tea",
    difficulty: "medium",
    category: "drinks"
  },
  {
    civilian_word: "Book",
    undercover_word: "Magazine",
    difficulty: "medium",
    category: "reading"
  },
  {
    civilian_word: "Summer",
    undercover_word: "Winter",
    difficulty: "medium",
    category: "seasons"
  },
  {
    civilian_word: "Doctor",
    undercover_word: "Nurse",
    difficulty: "hard",
    category: "professions"
  },
  {
    civilian_word: "Mountain",
    undercover_word: "Hill",
    difficulty: "hard",
    category: "geography"
  }
];

// Add words to the database
export const addWordPair = async (wordPair: Omit<WordPair, 'id' | 'created_at'>) => {
  try {
    const docRef = await addDoc(collection(db, 'word_pairs'), {
      ...wordPair,
      created_at: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding word pair:', error);
    throw error;
  }
};

// Get random word pair from database
export const getRandomWordPair = async (difficulty?: string): Promise<WordPair | null> => {
  try {
    let querySnapshot;
    
    if (difficulty) {
      const q = query(collection(db, 'word_pairs'), where('difficulty', '==', difficulty));
      querySnapshot = await getDocs(q);
    } else {
      querySnapshot = await getDocs(collection(db, 'word_pairs'));
    }
    
    const wordPairs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WordPair[];
    
    if (wordPairs.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * wordPairs.length);
    return wordPairs[randomIndex];
  } catch (error) {
    console.error('Error getting word pairs:', error);
    return null;
  }
};

// Initialize the database with sample words (call this once)
export const initializeSampleWords = async () => {
  try {
    const existingWords = await getDocs(collection(db, 'word_pairs'));
    
    if (existingWords.empty) {
      console.log('Adding sample words to database...');
      
      for (const wordPair of sampleWordPairs) {
        await addWordPair(wordPair);
      }
      
      console.log('Sample words added successfully!');
    } else {
      console.log('Database already has words');
    }
  } catch (error) {
    console.error('Error initializing sample words:', error);
  }
};
