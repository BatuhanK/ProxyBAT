import { useEffect, useState } from "react";
import logoSrc from "../assets/logo.png";

interface SplashScreenProps {
  onDone: () => void;
  duration?: number;
}

export function SplashScreen({ onDone, duration = 1000 }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out 400ms before done
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 200);
    const doneTimer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#000000" }}
    >
      <img src={logoSrc} alt="ProxyBat" style={{ width: 750, height: 500 }} />
      {/* Loading bar */}
      <div className="w-64 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/50 rounded-full"
          style={{ animation: `splash-progress ${duration}ms linear forwards` }}
        />
      </div>

      <style>{`
        @keyframes splash-progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
