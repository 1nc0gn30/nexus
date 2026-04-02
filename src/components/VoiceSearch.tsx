import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VoiceSearchProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onTranscript, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Allow mic access and retry.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone detected.');
      } else {
        setError(`Voice error: ${event.error}`);
      }
    };

    setRecognition(rec);

    return () => {
      try {
        rec.stop();
      } catch {
        // no-op
      }
    };
  }, [onTranscript]);

  const canUseVoice = Boolean(recognition);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    try {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch {
      setError('Could not start voice input.');
    }
  }, [recognition, isListening]);

  const statusText = useMemo(() => {
    if (!canUseVoice) return 'Voice unavailable in this browser (try Chrome/Edge).';
    if (isListening) return 'Listening...';
    if (error) return error;
    return 'Tap the mic and speak to fill search.';
  }, [canUseVoice, isListening, error]);

  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2', className)}>
      <p className="text-[10px] text-zinc-400 leading-relaxed">{statusText}</p>
      <button
        onClick={toggleListening}
        disabled={!canUseVoice}
        className={cn(
          'shrink-0 p-2 rounded-full transition-all duration-200 flex items-center justify-center',
          isListening
            ? 'bg-red-500 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100',
          !canUseVoice && 'opacity-50 cursor-not-allowed hover:bg-zinc-800 hover:text-zinc-300',
        )}
        title={!canUseVoice ? 'Voice not supported' : isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
    </div>
  );
};
