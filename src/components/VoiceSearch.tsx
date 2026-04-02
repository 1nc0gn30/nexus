import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VoiceSearchProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export const VoiceSearch: React.FC<VoiceSearchProps> = ({ onTranscript, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown');
  const autoPromptedRef = useRef(false);

  const requestMicAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      setError(null);
    } catch (err: any) {
      setMicPermission('denied');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Microphone blocked. Allow access in browser site permissions.');
      } else if (err?.name === 'NotFoundError') {
        setError('No microphone found on this device.');
      } else {
        setError('Unable to access microphone.');
      }
    }
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isFirefox = ua.includes('firefox');
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1';
    const isSecure = window.isSecureContext || isLocalhost;

    if (!isSecure) {
      setError('Voice search requires HTTPS (or localhost).');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission blocked. Allow mic access and retry.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone detected.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Try again.');
        } else if (event.error === 'network') {
          setError('Speech service network error.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      setMicPermission('unsupported');
      setError(
        isFirefox
          ? 'Voice search is unavailable in Firefox on Linux. Use typing or Chrome/Edge.'
          : 'Speech recognition is not available in this browser.',
      );
    }
  }, [onTranscript]);

  useEffect(() => {
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void requestMicAccess();
  }, [requestMicAccess]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  }, [recognition, isListening]);

  if (!recognition && !error && micPermission === 'unknown') return null;

  const canRecognizeSpeech = Boolean(recognition);

  const statusText = (() => {
    if (isListening) return 'Listening...';
    if (error) return error;
    if (canRecognizeSpeech && micPermission === 'granted') return 'Ready for voice input';
    if (!canRecognizeSpeech && micPermission === 'granted') return 'Mic enabled, but speech API is unavailable in this browser';
    if (!canRecognizeSpeech) return 'Voice search unavailable here (try Chrome/Edge)';
    if (micPermission === 'denied') return 'Microphone blocked. Enable it in site permissions.';
    return 'Enable microphone to use voice search';
  })();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
      {canRecognizeSpeech ? (
        <button
          onClick={toggleListening}
          className={cn(
            "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
            isListening 
              ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          )}
          title={isListening ? "Stop listening" : "Start voice search"}
        >
          <Mic size={18} />
        </button>
      ) : (
        <div
          className="px-2 py-1 rounded-md border border-zinc-700 bg-zinc-900 text-[9px] text-zinc-400 uppercase tracking-wider font-semibold"
          title={error || 'Voice search unavailable'}
        >
          Voice N/A
        </div>
      )}

      <button
        onClick={requestMicAccess}
        className={cn(
          "ml-2 px-2 py-1 rounded-md border text-[9px] font-semibold uppercase tracking-wider transition-colors",
          micPermission === 'granted'
            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            : "border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
        )}
        title="Request microphone permission"
      >
        {micPermission === 'granted' ? 'Mic Enabled' : 'Enable Mic'}
      </button>
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        {statusText}
      </p>
    </div>
  );
};
