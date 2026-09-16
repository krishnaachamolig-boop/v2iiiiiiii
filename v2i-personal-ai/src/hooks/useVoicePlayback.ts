import { useCallback, useRef, useState } from "react";
import { getTTSProvider } from "@/services/voice";

export function useVoicePlayback() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setSpeaking(true);
      const tts = getTTSProvider();
      const { audioUrl } = await tts.synthesize(text);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        await audio.play();
      } else {
        // Browser speechSynthesis path plays in-place and resolves on end.
        setSpeaking(false);
      }
    } catch (err) {
      console.error("[Voice playback]", err);
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speaking, speak, stop };
}
