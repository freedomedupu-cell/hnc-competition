import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
  Languages,
  Radio,
} from 'lucide-react';

interface VoiceTypingInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  portalLanguage?: 'en' | 'ta' | 'si';
  className?: string;
  multiline?: boolean;
  rows?: number;
}

export const VoiceTypingInput: React.FC<VoiceTypingInputProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = 'Type your answer or use voice typing...',
  portalLanguage = 'en',
  className = '',
  multiline = false,
  rows = 3,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'ta-LK' | 'si-LK' | 'en-US'>(() => {
    if (portalLanguage === 'ta') return 'ta-LK';
    if (portalLanguage === 'si') return 'si-LK';
    return 'en-US';
  });
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>(value);

  // Sync default speech recognition language when portal language changes
  useEffect(() => {
    if (portalLanguage === 'ta') setSpeechLanguage('ta-LK');
    else if (portalLanguage === 'si') setSpeechLanguage('si-LK');
    else setSpeechLanguage('en-US');
  }, [portalLanguage]);

  // Check browser support for SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startListening = () => {
    if (disabled) return;
    setSpeechError(null);
    setInterimTranscript('');
    baseValueRef.current = value;

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setSpeechError(
        portalLanguage === 'ta'
          ? 'உங்கள் உலாவியில் குரல் தட்டச்சு (Speech Recognition) ஆதரிக்கப்படவில்லை. Chrome/Edge உலாவியைப் பயன்படுத்தவும்.'
          : portalLanguage === 'si'
          ? 'ඔබගේ බ්‍රවුසරය හඬ ටයිප් කිරීම සඳහා සහය නොදක්වයි. Chrome/Edge භාවිතා කරන්න.'
          : 'Voice speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk) {
          const prefix = baseValueRef.current ? baseValueRef.current.trim() + ' ' : '';
          const updated = (prefix + finalChunk).trimStart();
          baseValueRef.current = updated;
          onChange(updated);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(
            portalLanguage === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியின் அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.'
              : portalLanguage === 'si'
              ? 'මයික්‍රෆෝන අවසරය ප්‍රතික්ෂේප කර ඇත. කරුණාකර බ්‍රවුසරයේ අවසර ලබා දෙන්න.'
              : 'Microphone access was denied. Please allow microphone permission in your browser.'
          );
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Normal when silent, don't crash
        } else {
          setSpeechError(`Voice input note: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError(err.message || 'Could not start voice recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClear = () => {
    stopListening();
    baseValueRef.current = '';
    onChange('');
    setInterimTranscript('');
  };

  return (
    <div className="space-y-2 w-full">
      {/* Input container with floating Voice Typing controls */}
      <div className="relative rounded-2xl border border-slate-300 bg-white transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 shadow-2xs">
        {multiline ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => {
              baseValueRef.current = e.target.value;
              onChange(e.target.value);
            }}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={`w-full bg-transparent px-4 py-3.5 pr-28 text-base text-slate-900 placeholder:text-slate-400 outline-none resize-y min-h-[90px] ${className}`}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => {
              baseValueRef.current = e.target.value;
              onChange(e.target.value);
            }}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-transparent px-4 py-3.5 pr-28 text-base text-slate-900 placeholder:text-slate-400 outline-none ${className}`}
          />
        )}

        {/* Floating Quick Action Buttons inside input */}
        <div className="absolute right-2 top-2.5 flex items-center gap-1.5 z-10">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title={portalLanguage === 'ta' ? 'அழி' : 'Clear'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Voice Typing Toggle Button */}
          {isSupported && (
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={disabled}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={
                isListening
                  ? portalLanguage === 'ta'
                    ? 'குரல் தட்டச்சை நிறுத்து'
                    : 'Stop Voice Typing'
                  : portalLanguage === 'ta'
                  ? 'குரல் தட்டச்சை தொடங்கு'
                  : 'Start Voice Typing'
              }
            >
              {isListening ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="hidden sm:inline">
                    {portalLanguage === 'ta' ? 'பேசவும்...' : portalLanguage === 'si' ? 'කතා කරන්න...' : 'Listening...'}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">
                    {portalLanguage === 'ta' ? 'குரல் வழி' : portalLanguage === 'si' ? 'හඬ මඟින්' : 'Voice Type'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Voice Recognition Toolbar & Language Selector */}
      {isSupported && !disabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 px-1">
          {/* Active Listening Soundwave Indicator */}
          {isListening ? (
            <div className="flex items-center gap-2 text-rose-600 font-semibold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>
                {portalLanguage === 'ta'
                  ? '🎙️ கேட்டுக்கொண்டிருக்கிறது... தெளிவாகப் பேசவும்'
                  : portalLanguage === 'si'
                  ? '🎙️ සවන් දෙමින්... පැහැදිලිව කතා කරන්න'
                  : '🎙️ Listening... Speak your answer clearly'}
              </span>
              {interimTranscript && (
                <span className="italic text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px]">
                  "{interimTranscript}"
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {portalLanguage === 'ta'
                  ? 'விரைவாகப் பதிலளிக்க மைக்ரோஃபோன் பொத்தானை அழுத்திப் பேசலாம்'
                  : portalLanguage === 'si'
                  ? 'ඉක්මනින් පිළිතුරු දීමට මයික්‍රෆෝන බොත්තම ඔබා කතා කරන්න'
                  : 'You can speak your answer using the microphone button'}
              </span>
            </div>
          )}

          {/* Voice Language Selector (Tamil / Sinhala / English) */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 px-1 font-semibold flex items-center gap-1">
              <Languages className="w-3 h-3 text-slate-400" />
            </span>
            <button
              type="button"
              onClick={() => {
                setSpeechLanguage('ta-LK');
                if (isListening) {
                  stopListening();
                }
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                speechLanguage === 'ta-LK'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="தமிழ் குரல் தட்டச்சு (Tamil Voice Typing)"
            >
              தமிழ் (TA)
            </button>
            <button
              type="button"
              onClick={() => {
                setSpeechLanguage('si-LK');
                if (isListening) {
                  stopListening();
                }
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                speechLanguage === 'si-LK'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="සිංහල හඬ ටයිප් කිරීම (Sinhala Voice Typing)"
            >
              සිංහල (SI)
            </button>
            <button
              type="button"
              onClick={() => {
                setSpeechLanguage('en-US');
                if (isListening) {
                  stopListening();
                }
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                speechLanguage === 'en-US'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="English Voice Typing"
            >
              English (EN)
            </button>
          </div>
        </div>
      )}

      {/* Error / Permission Note */}
      {speechError && (
        <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{speechError}</span>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="ml-auto text-rose-500 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
