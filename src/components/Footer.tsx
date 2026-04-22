import { FC } from 'react';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Truck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FooterProps {
  universe: 'padilha' | 'mulamba';
}

export const Footer: FC<FooterProps> = ({ universe }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      "relative pt-24 pb-12 overflow-hidden border-t",
      universe === 'padilha' ? "bg-white border-red-100" : "bg-zinc-50 border-purple-100"
    )}>
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-zinc-100/50 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Info */}
          <div className="space-y-8">
            <h3 className={cn(
              "text-2xl font-black uppercase tracking-tighter italic",
              universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
            )}>
              Perfumaria M&M
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 leading-relaxed">
              Elevando sua essência ao patamar do sagrado. Fragrâncias consagradas para o corpo e para a alma.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900 border-b border-zinc-100 pb-4">
              Explore o Ritual
            </h4>
            <ul className="space-y-4">
              {['Catálogo Completo', 'Linhagem Padilha', 'Linhagem Mulamba', 'Pedidos Realizados', 'Área VIP'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-4 h-px bg-zinc-900 transition-all" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900 border-b border-zinc-100 pb-4">
              Conexão Direta
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-zinc-900" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-zinc-400">Atendimento WhatsApp</p>
                  <p className="text-xs font-bold text-zinc-900">(11) 99999-9999</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-zinc-900" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-zinc-400">Suporte Técnico</p>
                  <p className="text-xs font-bold text-zinc-900">sagrado@perfumariamm.com</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900 border-b border-zinc-100 pb-4">
              Iniciação Exclusiva
            </h4>
            <p className="text-[10px] font-bold uppercase text-zinc-400 leading-relaxed">
              Receba avisos de consagração e novas essências em primeira mão.
            </p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="SEU EMAIL SAGRADO" 
                className="w-full bg-zinc-100 rounded-2xl px-6 py-4 text-[10px] font-black uppercase placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all shadow-inner"
              />
              <button className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:scale-95 transition-all">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Payment & Security Badges */}
        <div className="pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6 grayscale opacity-30">
            <CreditCard className="w-6 h-6" />
            <ShieldCheck className="w-6 h-6" />
            <Truck className="w-6 h-6" />
            <img src="https://img.icons8.com/color/48/visa.png" className="h-6" alt="Visa" />
            <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6" alt="Mastercard" />
            <img src="https://img.icons8.com/color/48/pix.png" className="h-6" alt="Pix" />
          </div>
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            © {currentYear} Perfumaria M&M. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
