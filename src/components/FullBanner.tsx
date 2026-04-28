import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Banner } from '../types';
import { cn } from '../lib/utils';

interface FullBannerProps {
  banners: Banner[];
}

export function FullBanner({ banners }: FullBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // Find a random index that is different from the current one
        let nextIndex;
        if (banners.length <= 1) return prev;
        
        do {
          nextIndex = Math.floor(Math.random() * banners.length);
        } while (nextIndex === prev);
        
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const activeBanner = banners[currentIndex];

  if (!activeBanner) return null;

  return (
    <section className="relative h-[65vh] md:h-[650px] w-full rounded-[40px] overflow-hidden glass-morphism border-zinc-200 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Zoom effect on background */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            className="absolute inset-0"
          >
            <img
              src={activeBanner.image}
              alt={activeBanner.title}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Background Overlay */}
          <div className={cn(
            "absolute inset-0 z-10 transition-colors duration-1000",
            "bg-gradient-to-t from-zinc-950/80 via-zinc-900/40 to-transparent"
          )} />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6 md:px-12 space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex justify-center gap-2 mb-4"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-3 rounded-full",
                    activeBanner.universe === 'padilha' ? "bg-red-500 shadow-[0_0_15px_#ef4444]" : "bg-purple-500 shadow-[0_0_15px_#a855f7]"
                  )}
                />
              ))}
            </motion.div>

            <div className="space-y-2">
              <motion.span
                initial={{ opacity: 0, letterSpacing: '0.1em' }}
                animate={{ opacity: 0.4, letterSpacing: '0.4em' }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-white text-[10px] font-black uppercase tracking-[0.4em] block"
              >
                Edição Limitada
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] italic text-white drop-shadow-2xl select-none font-serif"
              >
                {activeBanner.title}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xs md:text-sm text-zinc-300 font-medium max-w-xl mx-auto uppercase tracking-[0.2em] leading-relaxed drop-shadow-sm select-none opacity-60"
            >
              {activeBanner.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="pt-6"
            >
              <button 
                className={cn(
                  "px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl",
                  activeBanner.universe === 'padilha' 
                    ? "bg-red-600 text-white shadow-red-900/20" 
                    : "bg-purple-600 text-white shadow-purple-900/20"
                )}
              >
                {activeBanner.buttonText}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className="group py-2"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                currentIndex === idx 
                  ? (activeBanner.universe === 'padilha' ? "w-10 bg-red-600" : "w-10 bg-purple-600")
                  : "w-4 bg-white/20 group-hover:bg-white/40"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
