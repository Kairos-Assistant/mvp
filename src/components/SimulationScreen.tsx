import React, { useState, useEffect, useRef } from "react";
import { CompanyProfile, SimulationSession, Message, EvaluatorType, FocusMode, Difficulty, RoundLength } from "../types";
import { GeminiService } from "../services/geminiService";
import { Timer, Send, Pause, Play, Square, Info, AlertCircle, Mic, MicOff } from "lucide-react";
import { cn } from "../lib/utils";
import { v4 as uuidv4 } from "uuid";

interface SimulationScreenProps {
  profile: CompanyProfile;
  config: {
    evaluator: EvaluatorType;
    focus: FocusMode;
    difficulty: Difficulty;
    roundLength: RoundLength;
  };
  onEnd: (session: SimulationSession) => void;
  onCancel: () => void;
}

export default function SimulationScreen({ profile, config, onEnd, onCancel }: SimulationScreenProps) {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentContext, setCurrentContext] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [totalTimeLeft, setTotalTimeLeft] = useState(parseInt(config.roundLength) * 60); 
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const answerRef = useRef(answer);
  const recognitionRef = useRef<any>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rebuild Speech Recognition from scratch
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setAnswer(prev => {
            const lastChar = prev.trim().slice(-1);
            const needsSpace = prev.length > 0 && !['.', '?', '!', ' '].includes(lastChar);
            return prev + (needsSpace ? ' ' : '') + finalText;
          });
          setInterimTranscript("");
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone access denied. Please check your browser settings.");
        } else if (event.error !== 'no-speech') {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        // If already started, just reset state
        setIsListening(true);
      }
    }
  };

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Initialize session
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const first = await GeminiService.generateQuestion(
          profile,
          config.evaluator,
          config.focus,
          config.difficulty,
          []
        );
        
        if (isMounted) {
          setCurrentQuestion(first.question);
          setCurrentContext(first.context);
          setTranscript([{
            role: "investor",
            content: first.question,
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to start simulation. Please check your connection.");
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [profile, config]);

  // Total Timer
  useEffect(() => {
    if (!isPaused && !isLoading && !isScoring && !error) {
      totalTimerRef.current = setInterval(() => {
        setTotalTimeLeft((prev) => {
          if (prev <= 1) {
            handleEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [isPaused, isLoading, isScoring, error]);

  const handleNext = async () => {
    if (isLoading || isScoring || error) return;
    
    const currentAnswer = answer.trim() || "[No answer provided]";
    const userMessage: Message = { role: "founder", content: currentAnswer, timestamp: new Date().toISOString() };
    const updatedTranscript = [...transcript, userMessage];
    
    setTranscript(updatedTranscript);
    setAnswer("");
    setIsLoading(true);
    setNudge(null);
    if (isListening) recognitionRef.current?.stop();

    try {
      const next = await GeminiService.generateQuestion(
        profile,
        config.evaluator,
        config.focus,
        config.difficulty,
        updatedTranscript
      );
      
      setCurrentQuestion(next.question);
      setCurrentContext(next.context);
      setNudge(next.nudge || null);
      setTranscript(prev => [...prev, {
        role: "investor",
        content: next.question,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Error generating next question", err);
      setError("The investor is having trouble responding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = async () => {
    if (isScoring) return;
    setIsScoring(true);
    if (isListening) recognitionRef.current?.stop();
    
    try {
      const scores = await GeminiService.scoreSession(
        profile,
        config.focus,
        transcript,
        parseInt(config.roundLength)
      );
      
      const session: SimulationSession = {
        id: uuidv4(),
        companyProfileId: profile.id,
        evaluatorType: config.evaluator,
        focusType: config.focus,
        difficulty: config.difficulty,
        roundLength: parseInt(config.roundLength),
        createdAt: new Date().toISOString(),
        transcript,
        scores,
        tags: []
      };
      
      onEnd(session);
    } catch (err) {
      console.error("Error scoring session", err);
      setIsScoring(false);
      setError("Failed to generate scores. Please try ending again.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#E3DBD5]">
      {/* Top Bar */}
      <div className="bg-[#E3DBD5] border-b border-black/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#6279b8] font-bold">
            <Timer size={20} />
            <span className="tabular-nums">{formatTime(totalTimeLeft)}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-600 text-sm">
            <span className="font-bold">{profile.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-slate-600 hover:bg-black/5 rounded-lg transition-all"
          >
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          </button>
          <button 
            onClick={handleEnd}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-all"
          >
            <Square size={16} fill="currentColor" />
            <span>End</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center py-12">
            {error ? (
              <div className="text-center p-8 bg-red-50 rounded-[32px] border border-red-100">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h3>
                <p className="text-red-700 mb-6">{error}</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={onCancel}
                    className="px-6 py-3 bg-white text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-12">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                    <Info size={14} />
                    <span>{currentContext || "Investor is listening..."}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold leading-tight text-slate-800">
                    {isLoading ? (
                      <span className="animate-pulse text-slate-400">Investor is thinking...</span>
                    ) : (
                      currentQuestion
                    )}
                  </h2>
                </div>

                <div className="relative group">
                  <textarea
                    value={answer + (interimTranscript ? (answer ? " " : "") + interimTranscript : "")}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isLoading || isPaused || isScoring}
                    placeholder="Type your answer here or use the microphone..."
                    className="w-full p-6 bg-white/40 backdrop-blur-sm border-2 border-black/5 rounded-2xl focus:border-[#6279b8] outline-none transition-all min-h-[200px] text-lg shadow-sm pr-16"
                  />
                  
                  <button
                    onClick={toggleListening}
                    disabled={isLoading || isPaused || isScoring}
                    className={cn(
                      "absolute top-4 right-4 p-3 rounded-full transition-all",
                      isListening 
                        ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20" 
                        : "bg-black/5 text-slate-500 hover:bg-black/10"
                    )}
                    title={isListening ? "Stop Listening" : "Start Voice-to-Text"}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {isListening && (
                    <div className="absolute bottom-4 left-6 flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Listening...</span>
                    </div>
                  )}
                </div>

                {nudge && (
                  <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50/50 p-3 rounded-lg text-sm font-medium border border-amber-100">
                    <AlertCircle size={16} />
                    <span>{nudge}</span>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={isLoading || isPaused || isScoring || !answer.trim()}
                    className="flex items-center gap-2 px-8 py-4 bg-[#6279b8] text-white font-bold rounded-xl hover:bg-[#5266a0] disabled:opacity-50 transition-all shadow-lg shadow-[#6279b8]/20"
                  >
                    <span>Next Question</span>
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scoring Overlay */}
      {isScoring && (
        <div className="fixed inset-0 bg-[#E3DBD5]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#6279b8] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Generating Conviction Score...</h2>
            <p className="text-slate-600 font-medium">Analyzing your articulation and blind spots.</p>
          </div>
        </div>
      )}
    </div>
  );
}
