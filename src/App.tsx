import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  History,
  ArrowRight,
  User,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CHARACTERS, Character } from './data';

const MAX_ATTEMPTS = 5;

export default function App() {
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [record, setRecord] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load record from localStorage
  useEffect(() => {
    const savedRecord = localStorage.getItem('nmt_history_record');
    if (savedRecord) setRecord(parseInt(savedRecord, 10));
  }, []);

  // Update record
  useEffect(() => {
    if (score > record) {
      setRecord(score);
      localStorage.setItem('nmt_history_record', score.toString());
    }
  }, [score, record]);

  const startNewRound = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    setCurrentCharacter(CHARACTERS[randomIndex]);
    setHintIndex(0);
    setAttempts(MAX_ATTEMPTS);
    setUserInput('');
    setFeedback(null);
    setIsRevealed(false);
    setGameState('playing');
    
    // Auto focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleStartGame = () => {
    setScore(0);
    startNewRound();
  };

  const normalizeText = (text: string) => {
    return text.trim().toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/і/g, 'i') // handle potential latin/cyrillic mix
      .replace(/ї/g, 'ї')
      .replace(/є/g, 'є')
      .replace(/ґ/g, 'ґ');
  };

  const checkAnswer = () => {
    if (!currentCharacter || !userInput.trim()) return;

    const normalizedInput = normalizeText(userInput);
    const normalizedFullName = normalizeText(currentCharacter.fullName);
    const normalizedSurname = normalizeText(currentCharacter.surname);
    const normalizedName = normalizeText(currentCharacter.name);

    const isCorrect = 
      normalizedInput === normalizedFullName || 
      normalizedInput === normalizedSurname ||
      (normalizedInput.length > 3 && normalizedFullName.includes(normalizedInput));

    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#0057B7', '#FFDD00']
      });
      setScore(prev => prev + 1);
      setFeedback({ type: 'success', message: `Правильно! Це ${currentCharacter.fullName}.` });
      setIsRevealed(true);
      setGameState('result');
    } else {
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      
      if (newAttempts <= 0) {
        setFeedback({ type: 'error', message: `Гру закінчено! Це був ${currentCharacter.fullName}.` });
        setIsRevealed(true);
        setGameState('result');
      } else {
        setFeedback({ type: 'error', message: 'Неправильно. Спробуйте ще раз!' });
        setUserInput('');
        inputRef.current?.focus();
      }
    }
  };

  const nextHint = () => {
    if (currentCharacter && hintIndex < currentCharacter.hints.length - 1) {
      setHintIndex(prev => prev + 1);
    } else {
      setFeedback({ type: 'info', message: 'Більше підказок немає!' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (gameState === 'playing') checkAnswer();
      else if (gameState === 'result') startNewRound();
    }
  };

  // Visual effects for portrait
  const getPortraitStyle = () => {
    if (isRevealed) return { filter: 'none', opacity: 1 };
    
    // More hints revealed = clearer image
    const blurAmount = Math.max(0, 20 - (hintIndex * 4));
    const brightness = 0.2 + (hintIndex * 0.1);
    
    return {
      filter: `blur(${blurAmount}px) brightness(${brightness}) grayscale(0.5)`,
      transition: 'all 0.5s ease'
    };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-[#0057B7] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0057B7] rounded-lg flex items-center justify-center">
              <History className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">Історичний Акінатор</h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Рахунок</span>
              <span className="font-mono text-xl font-bold leading-none">{score}</span>
            </div>
            <div className="flex flex-col items-end border-l border-[#E5E7EB] pl-4 sm:pl-8">
              <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">Рекорд</span>
              <span className="font-mono text-xl font-bold leading-none text-[#0057B7]">{record}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#111827]">
                  ВПІЗНАЙ ПОСТАТЬ
                </h2>
                <p className="text-[#4B5563] text-lg max-w-lg mx-auto leading-relaxed">
                  Перевір свої знання з історії України. Вгадай 54 історичні особи за портретами та підказками для успішного складання НМТ.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
                  <User className="w-6 h-6 text-[#0057B7] mb-2" />
                  <h3 className="font-bold text-sm mb-1">54 Постаті</h3>
                  <p className="text-xs text-[#6B7280]">Повний список згідно з програмою НМТ.</p>
                </div>
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
                  <Lightbulb className="w-6 h-6 text-[#FBBF24] mb-2" />
                  <h3 className="font-bold text-sm mb-1">Підказки</h3>
                  <p className="text-xs text-[#6B7280]">Від загальних фактів до конкретних досягнень.</p>
                </div>
                <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-[#10B981] mb-2" />
                  <h3 className="font-bold text-sm mb-1">Навчання</h3>
                  <p className="text-xs text-[#6B7280]">Детальні описи після кожної відповіді.</p>
                </div>
              </div>

              <button 
                onClick={handleStartGame}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-[#0057B7] font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0057B7] hover:bg-[#004494]"
              >
                Почати гру
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && currentCharacter && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              {/* Left: Portrait */}
              <div className="space-y-4">
                <div className="relative aspect-[4/5] bg-[#E5E7EB] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src={currentCharacter.portrait} 
                    alt="Historical Figure"
                    className="w-full h-full object-cover"
                    style={getPortraitStyle()}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-3 h-3 rounded-full border border-white/50 ${i < attempts ? 'bg-[#EF4444]' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                      <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Епоха</span>
                      <p className="text-white font-medium text-sm">{currentCharacter.era}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Interaction */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5E7EB] space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-widest">Підказка {hintIndex + 1}</span>
                    <div className="flex gap-1">
                      {currentCharacter.hints.map((_, i) => (
                        <div key={i} className={`h-1 w-4 rounded-full ${i <= hintIndex ? 'bg-[#0057B7]' : 'bg-[#E5E7EB]'}`} />
                      ))}
                    </div>
                  </div>
                  
                  <motion.p 
                    key={hintIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-medium leading-relaxed text-[#111827]"
                  >
                    "{currentCharacter.hints[hintIndex]}"
                  </motion.p>

                  <div className="pt-4 flex gap-2">
                    <button 
                      onClick={nextHint}
                      disabled={hintIndex >= currentCharacter.hints.length - 1}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#F3F4F6] hover:bg-[#E5E7EB] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-colors"
                    >
                      <Lightbulb className="w-4 h-4 text-[#FBBF24]" />
                      Наступна підказка
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Введіть ім'я або прізвище..."
                      className="w-full bg-white border-2 border-[#E5E7EB] focus:border-[#0057B7] rounded-2xl px-6 py-4 text-lg font-medium outline-none transition-all shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <kbd className="hidden sm:inline-block px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-[10px] text-[#6B7280] font-bold">ENTER</kbd>
                    </div>
                  </div>

                  <button 
                    onClick={checkAnswer}
                    className="w-full py-4 bg-[#111827] hover:bg-black text-white rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
                  >
                    Перевірити відповідь
                  </button>
                </div>

                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 ${
                      feedback.type === 'success' ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' : 
                      feedback.type === 'error' ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' : 
                      'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]'
                    }`}
                  >
                    {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : 
                     feedback.type === 'error' ? <XCircle className="w-5 h-5 shrink-0" /> : 
                     <HelpCircle className="w-5 h-5 shrink-0" />}
                    <p className="text-sm font-bold">{feedback.message}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {gameState === 'result' && currentCharacter && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-[#E5E7EB] overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-1/2 aspect-[4/5]">
                    <img 
                      src={currentCharacter.portrait} 
                      alt={currentCharacter.fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="sm:w-1/2 p-8 flex flex-col justify-center space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest font-black text-[#0057B7]">{currentCharacter.era}</span>
                      <h2 className="text-3xl font-black leading-tight">{currentCharacter.fullName}</h2>
                    </div>
                    
                    <div className="h-px bg-[#E5E7EB] w-12" />
                    
                    <p className="text-[#4B5563] leading-relaxed italic">
                      {currentCharacter.description}
                    </p>

                    <div className="pt-4">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                        attempts > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}>
                        {attempts > 0 ? (
                          <>
                            <Trophy className="w-4 h-4" />
                            Вгадано! (+1 бал)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Спроби вичерпано
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={startNewRound}
                  className="flex-1 py-5 bg-[#0057B7] hover:bg-[#004494] text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  Наступна постать
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setGameState('start')}
                  className="py-5 px-8 bg-white hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Меню
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-12 border-t border-[#E5E7EB] mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#9CA3AF] text-xs font-medium uppercase tracking-widest">
          <p>© 2026 Історичний Акінатор</p>
          <div className="flex gap-6">
            <span className="hover:text-[#0057B7] cursor-help">Програма НМТ</span>
            <span className="hover:text-[#0057B7] cursor-help">54 Постаті</span>
            <span className="hover:text-[#0057B7] cursor-help">Допомога</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
