import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ScrollingProductGridProps {
  products: Product[];
  universe: 'padilha' | 'mulamba' | 'malandragem' | 'damadanoite';
  onAdd: (product: Product) => void;
  onSelect: (product: Product) => void;
}

export function ScrollingProductGrid({ products, universe, onAdd, onSelect }: ScrollingProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Distribute products into rows by lineage
  const row1 = products.filter(p => p.personagem === 'padilha');
  const row2 = products.filter(p => p.personagem === 'mulamba');
  const row3 = products.filter(p => p.personagem === 'malandragem');
  const row4 = products.filter(p => p.personagem === 'damadanoite');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Calculate horizontal travel based on the number of items
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-60%", "0%"]);
  const x3 = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);
  const x4 = useTransform(scrollYProgress, [0, 1], ["-40%", "0%"]);

  const rows = [
    { items: row1, x: x1, label: "Linha Maria Padilha" },
    { items: row2, x: x2, label: "Linha Maria Mulambo" },
    { items: row3, x: x3, label: "Linha Malandragem" },
    { items: row4, x: x4, label: "Linha Dama da Noite" }
  ];

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden bg-transparent">
        <div className="space-y-16 md:space-y-24">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="w-full space-y-4">
              <div className="px-12 md:px-24">
                <div className="flex items-center gap-4 opacity-30">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-900 shrink-0">
                    {row.label}
                  </span>
                  <div className="h-px flex-1 bg-zinc-900" />
                </div>
              </div>

              <motion.div 
                style={{ x: row.x }}
                className="flex gap-12 px-[10vw] w-max"
              >
                {row.items.map((product, idx) => (
                  <div key={product.id} className="w-[320px] md:w-[400px] shrink-0">
                    <ProductCard
                      product={product}
                      index={idx}
                      universe={universe}
                      onAdd={onAdd}
                      onClick={onSelect}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
