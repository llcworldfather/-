import { useState, useEffect, useRef } from 'react';
import type { TarotCard } from './data/cards';
import { shuffleDeck, drawCardWithReversed } from './utils/tarot';
import type { DrawnCard } from './utils/tarot';
import { getTarotReading, getDailyCardReading } from './services/api';
import { hasTodayDailyCard, getTodayDailyCard, saveTodayDailyCard, updateTodayDailyCardReading } from './utils/dailyCard';
import { useLanguage } from './context/LanguageContext';
import { t } from './i18n/translations';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Deck } from './components/Deck';
import { CardReveal } from './components/CardReveal';
import { ReadingDisplay } from './components/ReadingDisplay';
import { StarryBackground } from './components/StarryBackground';
import { DailyCardReveal } from './components/DailyCardReveal';
import { LanguageToggle } from './components/LanguageToggle';
import { Analytics } from '@vercel/analytics/react';

type Stage = 'welcome' | 'shuffling' | 'drawing' | 'revealing' | 'reading' | 'daily-shuffling' | 'daily-revealing';

function App() {
  const { language } = useLanguage();
  const [stage, setStage] = useState<Stage>('welcome');
  const [question, setQuestion] = useState('');
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [reading, setReading] = useState('');
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const [drawnIndices, setDrawnIndices] = useState<number[]>([]);
  const [dailyCard, setDailyCard] = useState<DrawnCard | null>(null);
  const [dailyReading, setDailyReading] = useState('');
  const [isDailyReadingComplete, setIsDailyReadingComplete] = useState(false);

  // 用于追踪每日解读是否完成，以便保存到 LocalStorage
  const dailyReadingRef = useRef('');

  // Dynamic page title based on language
  useEffect(() => {
    document.title = language === 'zh' ? '塔罗占卜带师llc' : 'Tarot Master llc';
  }, [language]);

  const handleStart = () => {
    if (!question.trim()) return;
    setStage('shuffling');
    setDrawnIndices([]);
    setDrawnCards([]); // Reset drawn cards
    setReading(''); // Reset reading
    setIsReadingComplete(false);

    setTimeout(() => {
      setDeck(shuffleDeck());
      setStage('drawing');
    }, 2500);
  };

  // 每日一牌处理
  const handleDailyCard = () => {
    // 检查今天是否已经抽过牌
    if (hasTodayDailyCard()) {
      const cachedData = getTodayDailyCard();
      if (cachedData) {
        // 直接从缓存加载，跳过洗牌动画
        setDailyCard(cachedData.card);
        setDailyReading(cachedData.reading);
        setIsDailyReadingComplete(true); // Cached reading is complete
        setStage('daily-revealing');
        return;
      }
    }

    // 今天还没抽过牌，走正常流程
    setStage('daily-shuffling');
    setDailyCard(null);
    setDailyReading('');
    setIsDailyReadingComplete(false);
    dailyReadingRef.current = '';

    setTimeout(() => {
      const shuffledDeck = shuffleDeck();
      const card = drawCardWithReversed(shuffledDeck[0]);
      setDailyCard(card);
      setStage('daily-revealing');

      // 先保存卡牌信息（解读内容稍后更新）
      saveTodayDailyCard(card, '');

      // 延迟后开始获取解读
      setTimeout(() => {
        getDailyCardReading(card, language, (chunk) => {
          setDailyReading(prev => {
            const newReading = prev + chunk;
            dailyReadingRef.current = newReading;
            // 实时更新 LocalStorage
            updateTodayDailyCardReading(newReading);
            return newReading;
          });
        }).then(() => {
          setIsDailyReadingComplete(true);
        });
      }, 1500);
    }, 2000);
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
      // 抽牌时随机决定正逆位
      return newCard ? [...prev, drawCardWithReversed(newCard)] : prev;
    });
  };

  const handleRevealComplete = () => {
    setStage('reading');

    // Fetch reading with streaming
    getTarotReading(question, drawnCards, language, (chunk) => {
      setReading(prev => prev + chunk);
    }).then(() => {
      setIsReadingComplete(true);
    });
  };

  const handleReset = () => {
    setStage('welcome');
    setQuestion('');
    setReading('');
    setDrawnCards([]);
    setDrawnIndices([]);
    setDailyCard(null);
    setDailyReading('');
    setIsReadingComplete(false);
    setIsDailyReadingComplete(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-100 p-4 overflow-hidden relative font-serif">
      {/* Language Toggle */}
      <LanguageToggle />

      {/* Dynamic Background */}
      <StarryBackground />

      <main className="z-10 w-full max-w-4xl flex flex-col items-center justify-center min-h-[600px]">
        {stage === 'welcome' && (
          <WelcomeScreen
            question={question}
            setQuestion={setQuestion}
            onStart={handleStart}
            onDailyCard={handleDailyCard}
          />
        )}

        {(stage === 'shuffling' || stage === 'drawing') && (
          <div className="w-full flex flex-col items-center">
            {stage === 'drawing' && (
              <p className="mb-4 text-purple-200 text-lg tracking-widest animate-pulse">
                {drawnCards.length < 3
                  ? t('drawPrompt', language, { n: drawnCards.length + 1, current: drawnCards.length })
                  : t('drawComplete', language)}
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
            cards={drawnCards}
            isReadingComplete={isReadingComplete}
            onReset={handleReset}
          />
        )}

        {/* Daily Card Flow */}
        {(stage === 'daily-shuffling' || stage === 'daily-revealing') && (
          <DailyCardReveal
            card={dailyCard}
            reading={dailyReading}
            isShuffling={stage === 'daily-shuffling'}
            isReadingComplete={isDailyReadingComplete}
            onReset={handleReset}
          />
        )}
      </main>
      <Analytics />
    </div>
  );
}

export default App;

