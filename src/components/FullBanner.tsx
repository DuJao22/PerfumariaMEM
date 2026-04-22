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
            "absolute inset-0 z-10 transition-colors duration-1000 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none"
          )} />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6 md:px-12 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex justify-center gap-1.5"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-3 rounded-full opacity-50",
                    activeBanner.universe === 'padilha' ? "bg-[#e60000]" : "bg-[#8a2be2]"
                  )}
                />
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none italic text-zinc-900 drop-shadow-sm select-none"
            >
              {activeBanner.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-sm md:text-base text-zinc-700 font-medium max-w-lg mx-auto uppercase tracking-[0.15em] leading-relaxed drop-shadow-sm select-none"
            >
              {activeBanner.subtitle}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className={cn(
                "px-8 py-4 rounded-full font-bold uppercase text-[10px] tracking-[0.3em] transition-all text-white",
                activeBanner.universe === 'padilha' ? "bg-[#e60000] shadow-xl shadow-red-200/50" : "bg-[#8a2be2] shadow-xl shadow-purple-200/50"
              )}
            >
              {activeBanner.buttonText}
            </motion.button>
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
                  ? (activeBanner.universe === 'padilha' ? "w-10 bg-[#e60000]" : "w-10 bg-[#8a2be2]")
                  : "w-4 bg-zinc-400/30 group-hover:bg-zinc-400/50"
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
