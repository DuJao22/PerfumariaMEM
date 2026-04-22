import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  ShoppingCart, X, Plus, Minus, ArrowRight, Zap, Moon, Trash2, ShoppingBag, Edit3,
  User as UserIcon, LogOut, Package, LayoutDashboard, BarChart3, TrendingUp, Users, 
  CheckCircle2, Clock, Truck, ShieldCheck, ChevronRight, Menu, Lock, Star
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { cn } from './lib/utils';
import { Product, CartItem, Universe, User, Order, DashboardStats, Banner } from './types';
import { FullBanner } from './components/FullBanner';
import { ProductCard } from './components/ProductCard';
import { ScrollingProductGrid } from './components/ScrollingProductGrid';
import { Footer } from './components/Footer';

const BANNERS: Banner[] = [
  {
    id: 1,
    title: 'O Fogo Sensual',
    subtitle: 'Explore a nova coleção de essências raras desenhadas para cada momento de sua vida.',
    image: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=80&w=1920',
    buttonText: 'Descobrir Linha',
    universe: 'padilha'
  },
  {
    id: 2,
    title: 'O Mistério Oculto',
    subtitle: 'A profundidade secreta das flores noturnas em uma fragrância inesquecível.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1920',
    buttonText: 'Explorar Agora',
    universe: 'mulamba'
  },
  {
    id: 3,
    title: 'Esplendor Carmesim',
    subtitle: 'A intensidade da paixão capturada em um frasco de elegância absoluta.',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1920',
    buttonText: 'Ver Coleção',
    universe: 'padilha'
  },
  {
    id: 4,
    title: 'Ventos de Violeta',
    subtitle: 'Um sopro de frescor etéreo vindo de jardins secretos de Mulamba.',
    image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&q=80&w=1920',
    buttonText: 'Descobrir Mais',
    universe: 'mulamba'
  }
];

export default function App() {
  const [universe, setUniverse] = useState<Universe>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('perfume-universe') : null;
    return (saved as Universe) || 'padilha';
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('perfume-cart') : null;
    return saved ? JSON.parse(saved) : [];
  });
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | null>(null);
  
  // App Views
  const [currentView, setCurrentView] = useState<'shop' | 'orders' | 'admin'>('shop');
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'produtos' | 'pedidos' | 'crm'>('dashboard');
  
  // Modals & Triggers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Backend Data
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [toast, setToast] = useState<{ productName: string } | null>(null);
  const [newOrderNotification, setNewOrderNotification] = useState<any | null>(null);

  useEffect(() => {
    if (newOrderNotification) {
      // Som de notificação
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Bloqueio de áudio pelo browser:', e));
      const timer = setTimeout(() => setNewOrderNotification(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [newOrderNotification]);

  useEffect(() => {
    if (user?.tipo === 'admin') {
      const socket = io();
      socket.on('novo_pedido', (data) => {
        setNewOrderNotification(data);
        // Recarregar dados se estiver no painel admin
        fetch('/api/admin/pedidos').then(res => res.json()).then(data => setAdminOrders(data));
        fetch('/api/admin/stats').then(res => res.json()).then(data => setStats(data));
      });
      return () => {
        socket.disconnect();
      }
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('perfume-universe', universe);
  }, [universe]);

  useEffect(() => {
    localStorage.setItem('perfume-cart', JSON.stringify(cart));
  }, [cart]);

  // Initial Data Fetch
  useEffect(() => {
    fetch(`/api/produtos?personagem=${universe}`)
      .then(res => res.json())
      .then(data => setProducts(data));
      
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data));
  }, [universe]);

  useEffect(() => {
    if (currentView === 'orders' && user) {
      fetch('/api/meus-pedidos')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMyOrders(data);
          } else {
            setMyOrders([]);
          }
        })
        .catch(() => setMyOrders([]));
    } else if (currentView === 'admin' && user?.tipo === 'admin') {
      fetch('/api/admin/pedidos').then(res => res.json()).then(data => setAdminOrders(data));
      fetch('/api/admin/stats').then(res => res.json()).then(data => setStats(data));
      fetch('/api/admin/produtos').then(res => res.json()).then(data => setAdminProducts(data));
      fetch('/api/admin/usuarios').then(res => res.json()).then(data => setAdminUsers(data));
    }
  }, [currentView, user, adminSubTab]);

  const refreshProducts = () => {
    fetch('/api/admin/produtos').then(res => res.json()).then(data => setAdminProducts(data));
    if (currentView === 'shop') {
      fetch(`/api/produtos?personagem=${universe}`).then(res => res.json()).then(data => setProducts(data));
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Deseja remover este produto?')) return;
    const res = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' });
    if (res.ok) refreshProducts();
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, preco_unitario: product.preco }];
    });
    setToast({ productName: product.nome });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const cartTotal = useMemo(() => 
    cart.reduce((acc, item) => acc + item.preco * item.quantity, 0),
  [cart]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setAuthView(null);
      if (data.tipo === 'admin') {
        setCurrentView('admin');
      }
    } else {
      alert('Login inválido');
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (res.ok) {
      setAuthView('login');
      alert('Cadastro realizado! Faça login agora.');
    } else {
      alert('Erro no cadastro');
    }
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).then(() => {
      setUser(null);
      setCurrentView('shop');
    });
  };

  const handleCheckout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCheckoutStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const orderData = {
      cliente: user?.nome || formData.get('nome'),
      total: cartTotal,
      itens: cart.map(item => ({ 
        produto_id: item.id, 
        quantidade: item.quantity,
        preco_unitario: item.preco_unitario
      }))
    };

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        setCheckoutStatus('success');
        setTimeout(() => {
          setCart([]);
          setIsCheckoutOpen(false);
          setCheckoutStatus('idle');
          if (user) setCurrentView('orders');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setCheckoutStatus('idle');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
    }
  };

  // Reusable Components
  const StatusBadge = ({ status }: { status: Order['status'] }) => {
    const colors = {
      pendente: 'bg-amber-500/20 text-amber-500 bg-amber-500/10 border border-amber-500/20',
      pago: 'bg-green-500/20 text-green-500 bg-green-500/10 border border-green-500/20',
      enviado: 'bg-blue-500/20 text-blue-500 bg-blue-500/10 border border-blue-500/20',
      entregue: 'bg-zinc-500/20 text-zinc-400 bg-zinc-500/10 border border-zinc-500/20'
    };
    const icons = {
      pendente: <Clock className="w-3 h-3" />,
      pago: <ShieldCheck className="w-3 h-3" />,
      enviado: <Truck className="w-3 h-3" />,
      entregue: <CheckCircle2 className="w-3 h-3" />
    };
    return (
      <span className={cn("px-2 py-1 rounded-full text-[10px] uppercase font-bold flex items-center gap-1.5 w-fit", colors[status])}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-1000 relative",
      universe === 'padilha' ? "universe-padilha text-zinc-900 bg-white" : "universe-mulamba text-zinc-900 bg-zinc-50"
    )}>
      {/* Global Theme Background Layer */}
      <AnimatePresence>
        {universe === 'padilha' && (
          <motion.div 
            key="padilha-global-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920" 
              className="w-full h-full object-contain mix-blend-multiply flex items-center justify-center p-20"
              alt="Logo Background"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICAÇÃO DE NOVO PEDIDO (ADMIN) */}
      <AnimatePresence>
        {newOrderNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 20 }} 
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md bg-white text-black p-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-zinc-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Pedido Chegando!</h4>
              <p className="text-sm font-bold truncate">#{newOrderNotification.id} - {newOrderNotification.cliente}</p>
              <p className="text-xl font-black italic">R$ {newOrderNotification.total.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setCurrentView('admin');
                  setAdminSubTab('pedidos');
                  setNewOrderNotification(null);
                }} 
                className="px-4 py-2 bg-zinc-900 text-white text-[10px] font-bold uppercase rounded-xl hover:opacity-80"
              >
                Ver
              </button>
              <button onClick={() => setNewOrderNotification(null)} className="p-2 hover:bg-zinc-100 rounded-full self-center">
                <X className="w-4 h-4 opacity-40" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex justify-between items-center transition-all duration-700",
        "bg-white/90 backdrop-blur-[15px] border-b shadow-sm",
        universe === 'padilha' ? "border-[#e60000]/10" : "border-[#8a2be2]/10"
      )}>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setCurrentView('shop')}
            className={cn(
              "text-xl font-black uppercase tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-2",
              universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
            )}
          >
            PERFUMARIA M<span className="opacity-40">&</span>M
          </button>
          
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('shop')} 
              className={cn("text-[10px] uppercase tracking-widest font-bold", currentView === 'shop' ? "opacity-100" : "opacity-40 hover:opacity-60")}
            >
              Catálogo
            </button>
            {user && (
              <button 
                onClick={() => setCurrentView('orders')} 
                className={cn("text-[10px] uppercase tracking-widest font-bold", currentView === 'orders' ? "opacity-100" : "opacity-40 hover:opacity-60")}
              >
                Meus Pedidos
              </button>
            )}
            {user?.tipo === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={cn("text-[10px] uppercase tracking-widest font-bold text-amber-400", currentView === 'admin' ? "opacity-100" : "opacity-40 hover:opacity-80")}
              >
                Dashboard Admin
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
               <span className="text-[10px] hidden sm:inline uppercase opacity-40 font-bold">Olá, {user.nome}</span>
               <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors"><LogOut className="w-5 h-5 opacity-40 hover:opacity-100" /></button>
            </div>
          ) : (
            <button onClick={() => setAuthView('login')} className="glass-morphism p-2 rounded-xl"><UserIcon className="w-5 h-5" /></button>
          )}
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="glass-morphism px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> 
            <span className="opacity-80 font-mono">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-20 min-h-screen">
        <AnimatePresence mode="wait">
          {/* SHOP VIEW */}
          {currentView === 'shop' && (
            <motion.div 
              key="shop" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Universe Toggle - Sales Engineering: Emotion-Led Selection */}
              <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8 space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 text-zinc-900">Qual energia te guia hoje?</h3>
                  <p className="text-sm font-bold italic opacity-60 text-zinc-900 leading-none">Escolha seu caminho e revele fragrâncias exclusivas</p>
                </div>
                <div className="glass-morphism p-3 rounded-[32px] max-w-sm mx-auto text-center border-zinc-200 shadow-xl relative z-10">
                  <div className="flex bg-zinc-100 rounded-2xl p-1.5 shadow-inner">
                    <button 
                      onClick={() => setUniverse('padilha')}
                      className={cn(
                        "flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all",
                        universe === 'padilha' ? "bg-[#e60000] text-white shadow-lg shadow-red-200/50 scale-105" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      Domínio
                    </button>
                    <button 
                      onClick={() => setUniverse('mulamba')}
                      className={cn(
                        "flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all",
                        universe === 'mulamba' ? "bg-[#8a2be2] text-white shadow-lg shadow-purple-200/50 scale-105" : "text-zinc-400 hover:text-zinc-600"
                      )}
                    >
                      Mistério
                    </button>
                  </div>
                </div>
              </div>

              {/* FullBanner section */}
              <div className="max-w-6xl mx-auto px-4">
                <FullBanner banners={BANNERS.filter(b => b.universe === universe)} />
              </div>

              {/* Trust Section - Sales Engineering: Social Proof & Reliability */}
              <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 py-10 border-y border-zinc-100 mb-12 bg-white/5 backdrop-blur-sm rounded-[32px] shadow-sm">
                {[
                  { label: 'Entrega Blindada', desc: 'Rastreio em tempo real', icon: <Truck className="w-5 h-5" /> },
                  { label: 'Origem Garantida', desc: 'Frascos 100% Originais', icon: <ShieldCheck className="w-5 h-5" /> },
                  { label: 'Portal Seguro', desc: 'Dados e privacidade protegidos', icon: <Lock className="w-5 h-5" /> },
                  { label: 'Suporte Elite', desc: 'Atendimento VIP via WhatsApp', icon: <Star className="w-5 h-5" /> },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-center p-2 group">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xl">
                      {item.icon}
                    </div>
                    <div className="text-left">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 block leading-tight mb-1">{item.label}</span>
                       <p className="text-[9px] opacity-40 font-bold uppercase text-zinc-600 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Grid Section - Topo, Meio, Baixo com Scroll Lateral */}
              <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">
                  <div className="flex flex-col items-center gap-4 text-center mb-16">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.4em] opacity-40",
                    universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
                  )}>
                    A Experiência Dinâmica
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-zinc-900">
                    Sinta o Movimento
                  </h2>
                </div>
              </div>

              <ScrollingProductGrid 
                  products={products}
                  universe={universe}
                  onAdd={addToCart}
                  onSelect={setSelectedProduct}
                />

                {products.length > 12 && (
                  <div className="max-w-6xl mx-auto px-4">
                    <div className="flex justify-center pt-20">
                      <button 
                        onClick={() => {}} // Placeholder
                        className="px-8 py-3 rounded-2xl border border-zinc-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all active:scale-95"
                      >
                        Ver Catálogo Completo
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* PRODUCT DETAIL MODAL */}
          <AnimatePresence>
            {selectedProduct && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0 bg-white/60 backdrop-blur-md z-[400]" />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-4 md:inset-auto md:w-full md:max-w-4xl md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white border border-zinc-200 z-[401] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full z-10 text-zinc-400 hover:text-zinc-900"><X /></button>
                  
                  <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-zinc-100 flex items-center justify-center overflow-hidden">
                    <img src={selectedProduct.imagem} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className="flex-1 p-8 md:p-12 space-y-8 flex flex-col justify-center">
                    <div className="space-y-2">
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-[0.3em]",
                         universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
                       )}>
                         {selectedProduct.categoria} • Linhagem {selectedProduct.personagem === 'padilha' ? 'Padilha' : 'Mulamba'}
                       </span>
                       <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-zinc-900">{selectedProduct.nome}</h2>
                    </div>

                    <p className="text-zinc-600 text-sm md:text-base leading-relaxed uppercase tracking-wider font-medium">
                      {selectedProduct.descricao || "Uma essência rara, destilada para momentos de poder e mistério. Sinta a presença de Perfumaria M & M."}
                    </p>

                    <div className="space-y-6">
                      <div className="flex items-baseline gap-2">
                         <span className="text-sm opacity-40 uppercase font-black text-zinc-900">Investimento:</span>
                         <span className="text-4xl font-black italic text-zinc-900">R$ {selectedProduct.preco.toFixed(2)}</span>
                      </div>

                      <button 
                        onClick={() => {
                          addToCart(selectedProduct);
                          setSelectedProduct(null);
                        }}
                        className={cn(
                          "w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl text-white",
                          universe === 'padilha' ? "bg-[#e60000] shadow-red-200/50" : "bg-[#8a2be2] shadow-purple-200/50"
                        )}
                      >
                        Consagrar no Carrinho
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* MY ORDERS VIEW */}
          {currentView === 'orders' && (
            <motion.div 
              key="orders" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Meus Pedidos</h2>
                <span className="px-4 py-2 glass-morphism rounded-full text-[10px] font-bold uppercase opacity-60">
                   {Array.isArray(myOrders) ? myOrders.length : 0} Histórico Total
                </span>
              </div>

              {!Array.isArray(myOrders) || myOrders.length === 0 ? (
                <div className="py-20 text-center glass-morphism rounded-[40px] opacity-20">
                   <Package className="w-20 h-20 mx-auto mb-4" />
                   <p className="font-bold uppercase tracking-widest text-xs">Nenhum pedido encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <div key={order.id} className="glass-morphism rounded-[32px] overflow-hidden border-zinc-200 shadow-sm">
                      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-zinc-50">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase opacity-40 font-bold">Pedido #{order.id}</p>
                          <h4 className="text-lg font-black uppercase italic">{new Date(order.data).toLocaleDateString()}</h4>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <StatusBadge status={order.status} />
                          <p className="text-xl font-black truncate">R$ {order.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {Array.isArray(order.itens) && order.itens.map(item => (
                          <div key={item.id} className="group relative">
                            <img src={item.imagem} className="w-full aspect-square object-cover rounded-2xl opacity-60 grayscale-[0.5] group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                            <span className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded-lg border border-zinc-700">{item.quantidade}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ADMIN DASHBOARD VIEW */}
          {currentView === 'admin' && user?.tipo === 'admin' && (
            <motion.div 
              key="admin" 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">Painel Admin</h2>
                    <p className="text-[10px] uppercase opacity-40 font-bold tracking-[0.2em]">Logística e Gestão</p>
                  </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
                    { id: 'produtos', label: 'Produtos', icon: <Package className="w-4 h-4" /> },
                    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingBag className="w-4 h-4" /> },
                    { id: 'crm', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSubTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all",
                        adminSubTab === tab.id ? "bg-white text-black shadow-lg" : "opacity-40 hover:opacity-100"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {adminSubTab === 'dashboard' && (
                <div className="space-y-10">
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { 
                        label: 'Faturamento Pago', 
                        val: stats ? `R$ ${(stats.faturamentoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Carregando...', 
                        icon: <TrendingUp className="text-green-500" />,
                        trend: '+12.5%' 
                      },
                      { 
                        label: 'Total Pedidos', 
                        val: stats?.totalPedidos ?? 0, 
                        icon: <Package className="text-blue-500" />,
                        trend: 'Histórico'
                      },
                      { 
                        label: 'Clientes Base', 
                        val: stats?.totalClientes ?? 0, 
                        icon: <Users className="text-purple-500" />,
                        trend: 'Cadastrados'
                      },
                      { 
                        label: 'Mais Vendido', 
                        val: stats?.topProdutos?.[0]?.n || 'N/A', 
                        icon: <Zap className="text-amber-500" />,
                        trend: stats?.topProdutos?.[0]?.q ? `${stats.topProdutos[0].q} un.` : '-'
                      }
                    ].map((kpi, idx) => (
                      <div key={idx} className="glass-morphism min-h-[140px] p-6 rounded-[32px] flex flex-col justify-between border-zinc-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-100 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-zinc-200 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-black opacity-30 tracking-widest">{kpi.label}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 opacity-40">{kpi.trend}</span>
                            </div>
                          </div>
                          <div className="p-2 bg-zinc-100 rounded-xl">
                            {kpi.icon}
                          </div>
                        </div>
                        <span className="text-2xl font-black truncate relative z-10 text-zinc-900">{kpi.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* CHARTS SECTION */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass-morphism p-8 rounded-[40px] space-y-8 border-zinc-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-xs uppercase font-black tracking-[0.2em] opacity-40 text-zinc-900">Faturamento Diário</h5>
                          <p className="text-[10px] opacity-20 font-bold uppercase mt-1 text-zinc-900">Últimos 10 registros de vendas</p>
                        </div>
                        <BarChart3 className="w-5 h-5 opacity-20 text-zinc-900" />
                      </div>
                      <div className="h-[300px] w-full">
                        {stats && stats.faturamentoPorDia?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.faturamentoPorDia}>
                              <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                              <XAxis 
                                dataKey="d" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)', fontWeight: 'bold' }} 
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)', fontWeight: 'bold' }} 
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  background: '#ffffff', 
                                  border: '1px solid rgba(0,0,0,0.1)', 
                                  borderRadius: '16px',
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  fontWeight: 'bold',
                                  color: '#000000'
                                }} 
                              />
                              <Line 
                                type="monotone" 
                                dataKey="t" 
                                stroke="#ef4444" 
                                strokeWidth={4} 
                                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} 
                                activeDot={{ r: 6, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                             <BarChart3 className="w-12 h-12" />
                             <p className="text-[10px] uppercase font-black tracking-widest">Sem dados de faturamento</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-morphism p-8 rounded-[40px] space-y-8 border-white/5">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs uppercase font-black tracking-[0.2em] opacity-40">Universo M&M</h5>
                        <PieChart className="w-5 h-5 opacity-20" />
                      </div>
                      <div className="h-[300px] w-full">
                        {stats && stats.faturamentoPorPersonagem?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.faturamentoPorPersonagem} layout="vertical" margin={{ left: -20 }}>
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="p" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'black', textTransform: 'uppercase' }} 
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ 
                                  background: '#09090b', 
                                  border: '1px solid rgba(255,255,255,0.1)', 
                                  borderRadius: '16px',
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  fontWeight: 'bold'
                                }} 
                              />
                              <Bar dataKey="v" radius={[0, 10, 10, 0]} barSize={20}>
                                {stats.faturamentoPorPersonagem.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.p === 'padilha' ? '#ef4444' : '#a855f7'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                             <PieChart className="w-12 h-12" />
                             <p className="text-[10px] uppercase font-black tracking-widest">Sem dados de universos</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Padilha</div>
                            <span>{Math.round((stats?.faturamentoPorPersonagem?.find(p => p.p === 'padilha')?.v || 0) / (stats?.faturamentoTotal || 1) * 100)}%</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Mulamba</div>
                            <span>{Math.round((stats?.faturamentoPorPersonagem?.find(p => p.p === 'mulamba')?.v || 0) / (stats?.faturamentoTotal || 1) * 100)}%</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* TOP PRODUCTS LIST */}
                  <div className="glass-morphism p-8 rounded-[40px] border-white/5">
                     <div className="flex justify-between items-center mb-8">
                        <div>
                          <h5 className="text-xs uppercase font-black tracking-[0.2em] opacity-40">Top Essências Vendidas</h5>
                          <p className="text-[10px] opacity-20 font-bold uppercase mt-1">Ranking por volume de saída</p>
                        </div>
                        <TrendingUp className="w-5 h-5 opacity-20" />
                     </div>
                     <div className="space-y-4">
                        {stats?.topProdutos?.map((prod, idx) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="text-xl font-black italic opacity-20 group-hover:opacity-100 transition-opacity">#{idx + 1}</div>
                                 <div className="font-bold uppercase italic text-sm">{prod.n}</div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="text-right">
                                    <p className="text-[10px] opacity-30 font-black uppercase">Quantidade</p>
                                    <p className="font-black text-sm">{prod.q} un.</p>
                                 </div>
                                 <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-amber-500" 
                                      style={{ width: `${(prod.q / (stats.topProdutos[0]?.q || 1)) * 100}%` }}
                                    />
                                 </div>
                              </div>
                           </div>
                        ))}
                        {(!stats?.topProdutos || stats.topProdutos.length === 0) && (
                          <p className="text-center py-10 text-[10px] font-black uppercase opacity-20 tracking-widest">Nenhuma venda registrada ainda</p>
                        )}
                     </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'produtos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Estoque de Essências</h3>
                    <button 
                      onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                      className="bg-zinc-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Produto
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {adminProducts.map(product => (
                      <div key={product.id} className="glass-morphism p-4 rounded-[32px] group border-zinc-200 space-y-4 shadow-sm">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">
                           <img src={product.imagem} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                           <div className={cn(
                             "absolute top-3 right-3 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                             product.personagem === 'padilha' ? "bg-red-500" : "bg-purple-500"
                           )}>
                             {product.personagem}
                           </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-40 mb-1">{product.categoria}</p>
                          <h4 className="font-bold uppercase truncate italic">{product.nome}</h4>
                          <p className="text-xl font-black mt-2">R$ {product.preco.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                            className="flex-1 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-xl transition-all flex justify-center text-zinc-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-xl transition-all flex justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminSubTab === 'pedidos' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gestão de Pedidos</h3>
                  <div className="overflow-x-auto rounded-[32px] glass-morphism">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-white/5">
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">ID</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Cliente</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Data</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Valor</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Status</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30 text-right">Ação</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {adminOrders.map(order => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-6 text-sm font-bold opacity-40">#{order.id}</td>
                              <td className="p-6 text-sm font-bold">{order.cliente}</td>
                              <td className="p-6 text-xs font-medium opacity-60">{new Date(order.data).toLocaleString()}</td>
                              <td className="p-6 text-sm font-black">R$ {order.total.toFixed(2)}</td>
                              <td className="p-6"><StatusBadge status={order.status} /></td>
                              <td className="p-6 text-right">
                                 <select 
                                   value={order.status}
                                   onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                   className="bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase focus:outline-none focus:border-white/30"
                                 >
                                   <option value="pendente">Pendente</option>
                                   <option value="pago">Pago</option>
                                   <option value="enviado">Enviado</option>
                                   <option value="entregue">Entregue</option>
                                 </select>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>
                </div>
              )}

              {adminSubTab === 'crm' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Gestão de Clientes (CRM)</h3>
                  <div className="overflow-x-auto rounded-[32px] glass-morphism">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-white/5">
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Cliente</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Identificador (Login)</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Pedidos</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Total Gasto</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30 text-right">Perfil</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {adminUsers.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                              <td className="p-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-xs font-black uppercase tracking-tighter">
                                    {u.nome.substring(0, 2)}
                                  </div>
                                  <span className="text-sm font-bold">{u.nome}</span>
                                </div>
                              </td>
                              <td className="p-6 text-sm font-bold opacity-40">{u.login}</td>
                              <td className="p-6 text-sm font-black">{u.total_pedidos}</td>
                              <td className="p-6 text-sm font-black text-green-500">R$ {(u.total_gasto || 0).toFixed(2)}</td>
                              <td className="p-6 text-right text-[10px] uppercase font-bold opacity-30 italic">Cliente Ativo</td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer universe={universe} />

      {/* MODALS & OVERLAYS */}
      
      {/* Auth Sidebar */}
      <AnimatePresence>
        {authView && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAuthView(null)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-zinc-200 z-[201] p-10 flex flex-col justify-center shadow-2xl">
               <button onClick={() => setAuthView(null)} className="absolute top-10 right-10 p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900"><X /></button>
               
               <div className="space-y-12">
                 <div className="space-y-4">
                    <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-zinc-900">
                      {authView === 'login' ? 'Voltar ao Êxtase' : 'Criar Essência'}
                    </h2>
                    <p className="opacity-40 uppercase text-xs tracking-widest font-medium text-zinc-500">Preencha seus dados para continuar</p>
                 </div>

                 <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-6">
                    {authView === 'register' && (
                      <div className="space-y-2">
                         <label className="text-[10px] uppercase tracking-widest font-black opacity-30">Nome Completo</label>
                         <input required name="nome" placeholder="Seu nome" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                      </div>
                    )}
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-black opacity-30">Seu Telefone ou Usuário</label>
                       <input required name="login" placeholder="Ex: seu_usuario ou 11999999999" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-black opacity-30">Senha Secreta</label>
                       <input required type="password" name="senha" placeholder="••••••••" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                    </div>
                    
                    <button className={cn(
                      "w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-xl text-white",
                      universe === 'padilha' ? "bg-[#e60000] shadow-red-200/50" : "bg-[#8a2be2] shadow-purple-200/50"
                    )}>
                      {authView === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
                    </button>
                 </form>

                 <div className="text-center">
                    <button 
                      onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
                      className="text-[10px] uppercase tracking-widest font-black opacity-40 hover:opacity-100"
                    >
                      {authView === 'login' ? 'Ainda não tem conta? Crie aqui' : 'Já possui conta? Faça login'}
                    </button>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-[380px] bg-white border-l border-zinc-200 z-[201] flex flex-col shadow-2xl">
              <div className="p-8 flex justify-between items-center border-b border-zinc-100">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Carrinho</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40 gap-4">
                    <ShoppingBag className="w-16 h-16 text-zinc-300" />
                    <p className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">Nada por aqui ainda...</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 glass-morphism p-3 rounded-[24px]">
                      <img src={item.imagem} className="w-20 h-24 rounded-2xl object-cover shrink-0 grayscale-[0.2]" />
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h5 className="font-bold text-sm uppercase truncate italic">{item.nome}</h5>
                          <p className="text-[10px] opacity-40 uppercase font-black">{item.categoria}</p>
                        </div>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3 bg-zinc-100 rounded-xl px-2 py-1">
                              <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-bold font-mono">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500"><Plus className="w-3 h-3" /></button>
                           </div>
                           <span className={cn(
                             "text-sm font-black",
                             universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
                           )}>R$ {(item.preco * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100">
                  <h6 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 text-center">Ritual Completo? Complete seu kit</h6>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {products.filter(p => !cart.find(c => c.id === p.id)).slice(0, 3).map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="flex-shrink-0 w-32 bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group text-left"
                      >
                        <img src={p.imagem} className="w-full h-16 object-contain mb-2 group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                        <p className="text-[8px] font-black uppercase italic leading-tight truncate">{p.nome}</p>
                        <p className="text-[10px] font-bold text-amber-500 mt-1">R$ {p.preco.toFixed(2)}</p>
                        <div className="mt-2 w-full py-1.5 bg-zinc-900 text-white text-[7px] font-black uppercase text-center rounded-lg">Adicionar</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <div className="p-8 border-t border-zinc-100 bg-zinc-50 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Estimado</span>
                    <span className="text-2xl font-black italic">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => { 
                      if (user) {
                        setIsCartOpen(false); 
                        setIsCheckoutOpen(true); 
                      } else {
                        setIsCartOpen(false);
                        setAuthView('login');
                      }
                    }}
                    className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-xl text-white",
                    universe === 'padilha' ? "bg-[#e60000] shadow-red-200/50" : "bg-[#8a2be2] shadow-purple-200/50"
                  )}>
                    {user ? 'Avançar para Checkout' : 'Login para Finalizar'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Map - Reduced version for brevity */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-white/95 backdrop-blur-3xl flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-12">
               <div className="flex justify-between items-center text-zinc-900">
                 <h2 className="text-5xl font-black uppercase tracking-tighter italic">Checkout</h2>
                 <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-8 h-8" /></button>
               </div>

               {checkoutStatus === 'success' ? (
                 <div className="text-center py-20 space-y-6">
                    <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl scale-125", universe === 'padilha' ? "bg-[#e60000]" : "bg-[#8a2be2]")}>
                      <ChevronRight className="w-12 h-12 rotate-[-45deg]" />
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic">Consagrado!</h3>
                    <p className="opacity-40 uppercase text-xs tracking-widest font-bold">Sua essência em breve estará com você.</p>
                 </div>
               ) : (
                 <form onSubmit={handleCheckout} className="space-y-8">
                   <div className="p-8 glass-morphism rounded-[40px] border-white/10 space-y-4">
                        <div className="flex justify-between opacity-40 text-[10px] font-black uppercase tracking-widest">
                           <span>Total da Essência</span>
                           <span>{cart.length} Produtos</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className={cn(
                          "flex justify-between text-4xl font-black italic",
                          universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
                        )}>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                   </div>

                   <button type="submit" className={cn(
                     "w-full py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.4em] transition-all active:scale-95 shadow-2xl",
                     universe === 'padilha' ? "bg-[#e60000]" : "bg-[#8a2be2]"
                   )}>
                     Selar Ritual de Compra
                   </button>
                 </form>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none"
          >
            <div className="glass-morphism px-6 py-4 rounded-[24px] border-zinc-200 shadow-2xl flex items-center gap-4 min-w-[300px]">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                universe === 'padilha' ? "bg-[#e60000] shadow-lg shadow-red-200/50 text-white" : "bg-[#8a2be2] shadow-lg shadow-purple-200/50 text-white"
              )}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-0.5 text-zinc-600">Adicionado ao carrinho</p>
                <p className="text-sm font-black uppercase italic truncate text-zinc-900">{toast.productName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600]" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-4 md:inset-auto md:w-full md:max-w-xl md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white border border-zinc-200 z-[601] p-10 rounded-[40px] shadow-2xl overflow-y-auto">
                <button onClick={() => setIsProductModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-zinc-100 rounded-full transition-all shrink-0 text-zinc-400 hover:text-zinc-900"><X /></button>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-zinc-900">
                      {editingProduct ? 'Ajustar Essência' : 'Nova Alquimia'}
                    </h2>
                    <p className="opacity-40 uppercase text-[10px] tracking-widest font-bold text-zinc-500">Defina as propriedades do produto</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = Object.fromEntries(formData);
                      const method = editingProduct ? 'PUT' : 'POST';
                      const url = editingProduct ? `/api/admin/produtos/${editingProduct.id}` : '/api/admin/produtos';
                      
                      const res = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      });
                      
                      if (res.ok) {
                        setIsProductModalOpen(false);
                        refreshProducts();
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Nome</label>
                        <input required name="nome" defaultValue={editingProduct?.nome} placeholder="Ex: Sedução Escarlate" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Preço (R$)</label>
                        <input required type="number" step="0.01" name="preco" defaultValue={editingProduct?.preco} placeholder="0.00" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">URL da Imagem</label>
                      <input required name="imagem" defaultValue={editingProduct?.imagem} placeholder="https://..." className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Categoria</label>
                        <input required name="categoria" defaultValue={editingProduct?.categoria} placeholder="Ex: Eau de Parfum" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Linhagem do Perfil</label>
                        <select name="personagem" defaultValue={editingProduct?.personagem || 'padilha'} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400 appearance-none text-zinc-900">
                          <option value="padilha" className="bg-white border-none">🍷 Padilha (Vibrante/Vermelho)</option>
                          <option value="mulamba" className="bg-white border-none">💜 Mulamba (Místico/Roxo)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Descrição</label>
                      <textarea name="descricao" defaultValue={editingProduct?.descricao} rows={3} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400 resize-none" />
                    </div>

                    <button type="submit" className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                      {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                    </button>
                  </form>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
