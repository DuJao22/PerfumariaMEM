import { useState, MouseEvent, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Check, Plus } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onClick: (product: Product) => void;
  universe: 'padilha' | 'mulambo';
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
      {/* Sales Engineering: Urgency Badge - Professional & High-End */}
      <div className="absolute -top-4 left-6 z-20 flex flex-col gap-1.5">
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border border-zinc-100 flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-zinc-500 italic">Disponibilidade Limitada</span>
        </motion.div>
        
        <div className="bg-black/40 backdrop-blur-md text-white/80 px-4 py-1 rounded-2xl text-[7px] font-bold uppercase tracking-[0.3em] inline-flex w-fit ml-2">
          {viewCount} Entusiastas vendo agora
        </div>
      </div>

      {/* Premium Decorative Background (Bordeaux with Gold/Hearts) */}
      <div className="absolute inset-0 rounded-[48px] overflow-hidden shadow-2xl transition-all duration-700 border border-amber-500/10 group-hover:border-amber-500/30">
        <img 
          src={universe === 'padilha' 
            ? "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800"
            : "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800"}
          className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-110 opacity-30 group-hover:opacity-50"
          alt="Product Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900/60 to-transparent" />
      </div>

      <div className={cn(
        "relative h-full flex flex-col p-8 rounded-[48px] transition-all duration-500",
        "flex flex-col gap-8 overflow-hidden min-h-[580px]"
      )}>
        {/* Product Image Area - Transparent Bottle Focus */}
        <div 
          onClick={() => onClick(product)}
          className="relative aspect-[4/5] flex items-center justify-center cursor-pointer"
        >
          {/* Subtle Glow behind the bottle */}
          <div className={cn(
            "absolute w-40 h-40 blur-[80px] rounded-full opacity-30",
            universe === 'padilha' ? "bg-red-500" : "bg-purple-500"
          )} />
          
          <motion.img 
            src={product.imagem} 
            alt={product.nome} 
            className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)] transition-transform duration-700 group-hover:scale-110 z-10"
            referrerPolicy="no-referrer"
          />
          
          {/* Badge */}
          <div className="absolute top-2 right-2">
             <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xl backdrop-blur-2xl border border-white/10",
               universe === 'padilha' ? "bg-red-600/60 text-white" : "bg-purple-600/60 text-white"
             )}>
               {universe === 'padilha' ? '🌹' : '✨'}
             </div>
          </div>
        </div>

        {/* Content Area - Premium Typography */}
        <div className="flex-1 flex flex-col gap-6 text-white">
          <div className="flex flex-col cursor-pointer group/info" onClick={() => onClick(product)}>
            <div className="flex justify-between items-center mb-2">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.4em] opacity-60",
                universe === 'padilha' ? "text-red-400" : "text-purple-400"
              )}>
                {product.categoria || 'Coleção Exclusive'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-500/60 group-hover/info:text-amber-500 transition-colors">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                ))}
              </div>
            </div>
            <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-[0.85] group-hover/info:translate-x-2 transition-transform duration-500">
              {product.nome}
            </h4>
          </div>
          
          <p className="text-[11px] text-zinc-400 font-medium italic tracking-wide leading-relaxed line-clamp-2 opacity-80">
            "{product.descricao || "Uma ode à sofisticação e ao mistério absoluto."}"
          </p>

          <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-amber-500 text-sm font-black italic">R$</span>
                <span className="text-4xl font-black tracking-tighter">
                  {product.preco.toFixed(2)}
                </span>
              </div>
              <span className="text-[8px] uppercase font-black tracking-[0.2em] opacity-30 mt-1">
                Até 12x de R$ {(product.preco / 12).toFixed(2)}
              </span>
            </div>

            <button 
              onClick={handleAdd}
              disabled={isAdded}
              className={cn(
                "relative h-16 w-16 group/btn rounded-2xl font-black uppercase transition-all overflow-hidden flex items-center justify-center",
                universe === 'padilha' 
                  ? "bg-red-600 text-white shadow-xl shadow-red-950/20" 
                  : "bg-purple-600 text-white shadow-xl shadow-purple-950/20",
                "hover:w-40 active:scale-95",
                isAdded && "bg-emerald-500 hover:w-16 scale-95"
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3 px-4">
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.div key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-3">
                      <Plus className="w-6 h-6 shrink-0" />
                      <span className="text-[10px] tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                        Adicionar
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
