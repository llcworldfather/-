import { useState, useEffect } from 'react';
import type { TarotCard } from './data/cards';
import { shuffleDeck } from './utils/tarot';
import { getTarotReading } from './services/api';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Deck } from './components/Deck';
import { CardReveal } from './components/CardReveal';
import { ReadingDisplay } from './components/ReadingDisplay';
import { StarryBackground } from './components/StarryBackground';

type Stage = 'welcome' | 'shuffling' | 'drawing' | 'revealing' | 'reading';

function App() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [reading, setReading] = useState('');
  const [drawnIndices, setDrawnIndices] = useState<number[]>([]);

  const handleStart = () => {
    if (!question.trim()) return;
    setStage('shuffling');
    setDrawnIndices([]);
    setDrawnCards([]); // Reset drawn cards
    setReading(''); // Reset reading

    setTimeout(() => {
      setDeck(shuffleDeck());
      setStage('drawing');
    }, 2500);
  };

  // Watch for 3 cards drawn to trigger transition
  useEffect(() => {
    if (drawnCards.length === 3 && stage === 'drawing') {
      const timer = setTimeout(() => {
        setStage('revealing');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [drawnCards.length, stage]);

  const handleDraw = (index?: number) => {
    if (stage !== 'drawing') return;
    if (index === undefined) return;

    setDrawnIndices(prev => {
      if (prev.includes(index) || prev.length >= 3) return prev;
      return [...prev, index];
    });

    setDrawnCards(prev => {
      if (prev.length >= 3) return prev;
      const newCard = deck[prev.length];
      return newCard ? [...prev, newCard] : prev;
    });
  };

  const handleRevealComplete = () => {
    setStage('reading');

    // Fetch reading with streaming
    getTarotReading(question, drawnCards, (chunk) => {
      setReading(prev => prev + chunk);
    });
  };

  const handleReset = () => {
    setStage('welcome');
    setQuestion('');
    setReading('');
    setDrawnCards([]);
    setDrawnIndices([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-100 p-4 overflow-hidden relative font-serif">
      {/* Dynamic Background */}
      <StarryBackground />

      <main className="z-10 w-full max-w-4xl flex flex-col items-center justify-center min-h-[600px]">
        {stage === 'welcome' && (
          <WelcomeScreen
            question={question}
            setQuestion={setQuestion}
            onStart={handleStart}
          />
        )}

        {(stage === 'shuffling' || stage === 'drawing') && (
          <div className="w-full flex flex-col items-center">
            {stage === 'drawing' && (
              <p className="mb-4 text-purple-200 text-lg tracking-widest animate-pulse">
                请抽取你的第 {drawnCards.length + 1} 张牌 ({drawnCards.length}/3)
              </p>
            )}
            <Deck
              stage={stage as 'shuffling' | 'drawing'}
              onDraw={handleDraw}
              drawnIndices={drawnIndices}
            />
          </div>
        )}

        {stage === 'revealing' && drawnCards.length > 0 && (
          <CardReveal
            cards={drawnCards}
            onComplete={handleRevealComplete}
          />
        )}

        {stage === 'reading' && (
          <ReadingDisplay
            reading={reading}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
