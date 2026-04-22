import { useState, MouseEvent, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Check } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onClick: (product: Product) => void;
  universe: 'padilha' | 'mulamba';
  index: number;
}

export const ProductCard: FC<ProductCardProps> = ({ product, onAdd, onClick, universe, index }) => {
  const [isAdded, setIsAdded] = useState(false);
  
  // Sales Engineering: Random urgency metrics
  const stockCount = useMemo(() => Math.floor(Math.random() * 5) + 2, [product.id]);
  const viewCount = useMemo(() => Math.floor(Math.random() * 15) + 5, [product.id]);

  const handleAdd = (e: MouseEvent) => {
    e.stopPropagation();
    onAdd(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.8, 
        delay: (index % 4) * 0.1, 
        ease: [0.21, 0.45, 0.32, 0.9]
      }}
      whileHover={{ y: -12 }}
      className="group relative"
    >
      {/* Sales Engineering: Urgency Badge */}
      <div className="absolute -top-3 left-6 z-20 flex flex-col gap-1">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-amber-400 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          {stockCount} Unidades Restantes
        </motion.div>
        
        <div className="bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-lg inline-flex w-fit">
          {viewCount} pessoas vendo agora
        </div>
      </div>

      {/* Premium Decorative Background (Bordeaux with Gold/Hearts) */}
      <div className="absolute inset-0 rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 border border-amber-500/20 group-hover:border-amber-500/40">
        <img 
          src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800"
          className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
          alt="Product Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      <div className={cn(
        "relative h-full flex flex-col p-6 rounded-[40px] transition-all duration-500",
        "flex flex-col gap-6 overflow-hidden min-h-[500px]"
      )}>
        {/* Product Image Area - Transparent Bottle Focus */}
        <div 
          onClick={() => onClick(product)}
          className="relative aspect-square flex items-center justify-center cursor-pointer"
        >
          {/* Subtle Glow behind the bottle */}
          <div className="absolute w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full" />
          
          <motion.img 
            src={product.imagem} 
            alt={product.nome} 
            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-110 z-10"
            referrerPolicy="no-referrer"
          />
          
          {/* Badge */}
          <div className="absolute top-0 right-0">
             <div className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-2xl backdrop-blur-xl border border-white/20",
               universe === 'padilha' ? "bg-red-600/80 text-white" : "bg-purple-600/80 text-white"
             )}>
               {universe === 'padilha' ? '🌹' : '✨'}
             </div>
          </div>
        </div>

        {/* Content Area - Premium Typography */}
        <div className="flex-1 flex flex-col gap-4 text-white">
          <div className="flex flex-col cursor-pointer" onClick={() => onClick(product)}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-1">
                {product.categoria}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                ))}
              </div>
            </div>
            <h4 className="text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">
              {product.nome}
            </h4>
          </div>
          
          <p className="text-xs text-zinc-300 font-medium uppercase tracking-widest leading-relaxed line-clamp-3">
            {product.descricao || "Essência rara para momentos de poder."}
          </p>

          <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
            <div className="flex flex-col">
              <span className="text-2xl font-black italic text-amber-400 drop-shadow-md">
                R$ {product.preco.toFixed(2)}
              </span>
              <span className="text-[8px] uppercase tracking-tighter opacity-60">Em até 12x de R$ {(product.preco / 12).toFixed(2)}</span>
            </div>

            <button 
              onClick={handleAdd}
              disabled={isAdded}
              className={cn(
                "relative h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all overflow-hidden flex items-center gap-2",
                universe === 'padilha' 
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/40" 
                  : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-900/40",
                isAdded && "bg-green-600 hover:bg-green-600 scale-95"
              )}
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="added"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>Adicionado</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Adicionar</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
