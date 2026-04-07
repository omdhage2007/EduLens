import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [text, setText] = useState('');
  const fullText = "Betterment for Every Student";
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTypingDone) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTypingDone, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050a12]"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#02c39a]/30 bg-[#02c39a]/10 shadow-[0_0_50px_rgba(2,195,154,0.2)] overflow-hidden"
      >
        <img 
          src="image.png" 
          alt="EduLens Logo" 
          className="h-24 w-24 object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 animate-ping rounded-full border border-[#02c39a]/20" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-syne text-4xl font-extrabold text-white">
          Edu<span className="text-[#38bdf8]">Lens</span>
        </h1>
        <p className="mt-4 h-6 font-instrument text-lg text-[#64748b]">
          {text}
          <span className="animate-pulse">|</span>
        </p>
      </motion.div>

      <div className="absolute bottom-12 w-64 overflow-hidden rounded-full bg-white/5 h-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="h-full bg-[#38bdf8]"
        />
      </div>
    </motion.div>
  );
}
