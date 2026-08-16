"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVoiceInput — Web Speech API wrapper para sa voice input.
 * Gumagana sa Chrome/Edge/Safari (may SpeechRecognition support).
 * Hindi available sa Firefox — graceful fallback.
 */
export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "fil-PH";
      rec.interimResults = true;
      rec.continuous = false;
      recognitionRef.current = rec;
    }
    return () => {
      try {
        (recognitionRef.current as { stop?: () => void })?.stop?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  const startListening = useCallback(
    (onResult: (text: string, isFinal: boolean) => void) => {
      const rec = recognitionRef.current as {
        start: () => void;
        stop: () => void;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      } | null;
      if (!rec) return;

      rec.onresult = (e) => {
        let text = "";
        let isFinal = false;
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          if (i === e.results.length - 1) {
            isFinal = true;
          }
        }
        onResult(text, isFinal);
      };
      rec.onerror = () => {
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };

      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    },
    [],
  );

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current as { stop?: () => void } | null;
    try {
      rec?.stop?.();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening };
}
