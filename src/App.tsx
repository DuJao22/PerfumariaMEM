import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  ShoppingCart, X, Plus, Minus, ArrowRight, Zap, Moon, Trash2, ShoppingBag, Edit3,
  User as UserIcon, LogOut, Package, LayoutDashboard, BarChart3, TrendingUp, Users, 
  CheckCircle2, Clock, Truck, ShieldCheck, ChevronRight, Menu, Lock, Star, Instagram, Globe
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
    universe: 'mulambo'
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
    subtitle: 'Um sopro de frescor etéreo vindo de jardins secretos de Mulambo.',
    image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&q=80&w=1920',
    buttonText: 'Descobrir Mais',
    universe: 'mulambo'
  }
];

const UNIVERSE_CONFIG: Record<Universe, { color: string; shadow: string; bg: string; text: string; name: string }> = {
  padilha: {
    color: '#e60000',
    shadow: 'shadow-red-200/50',
    bg: 'bg-[#e60000]',
    text: 'text-[#e60000]',
    name: 'Maria Padilha'
  },
  mulambo: {
    color: '#8a2be2',
    shadow: 'shadow-purple-200/50',
    bg: 'bg-[#8a2be2]',
    text: 'text-[#8a2be2]',
    name: 'Maria Mulambo'
  }
};

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
    const [currentView, setCurrentView] = useState<'shop' | 'orders' | 'admin'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('perfume-view') : null;
    return (saved as any) || 'shop';
  });
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'produtos' | 'pedidos' | 'crm' | 'config'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('perfume-admin-tab') : null;
    return (saved as any) || 'dashboard';
  });
  
  // Modals & Triggers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Backend Data
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminPersonagemFilter, setAdminPersonagemFilter] = useState<string>('todos');
  const [configs, setConfigs] = useState<Record<string, string>>({});

  const filteredAdminOrders = adminOrders;
  const filteredAdminUsers = adminUsers;
  const filteredAdminProducts = useMemo(() => {
    if (adminPersonagemFilter === 'todos') return adminProducts;
    return adminProducts.filter(p => p.personagem === adminPersonagemFilter);
  }, [adminProducts, adminPersonagemFilter]);
  const [toast, setToast] = useState<{ productName: string } | null>(null);
  const [newOrderNotification, setNewOrderNotification] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('perfume-view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('perfume-admin-tab', adminSubTab);
  }, [adminSubTab]);

  useEffect(() => {
    fetch('/api/configuracoes', { credentials: 'include' }).then(res => res.json()).then(data => setConfigs(data));
  }, []);

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
      const socket = io({ withCredentials: true });
      socket.on('novo_pedido', (data) => {
        setNewOrderNotification(data);
        // Recarregar dados se estiver no painel admin
        fetch('/api/admin/pedidos', { credentials: 'include' }).then(res => res.json()).then(data => setAdminOrders(data));
        fetch('/api/admin/stats', { credentials: 'include' }).then(res => res.json()).then(data => setStats(data));
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
    fetch(`/api/produtos?personagem=${universe}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProducts(data));
      
    // Verificar sessão
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        // Auto-redirect to admin if logged in as admin and view is shop
        if (data?.tipo === 'admin' && currentView === 'shop') {
           console.log('Detected admin session on shop view, redirecting...');
           setCurrentView('admin');
        }
      })
      .catch((err) => {
        console.error('Session check error:', err);
        setUser(null);
      });
  }, [universe]); 

  useEffect(() => {
    if (currentView === 'orders' && user) {
      setLoadingOrders(true);
      fetch('/api/meus-pedidos', { credentials: 'include' })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            // Se for erro de login, apenas tratamos sem logar erro no console catch
            if (res.status === 401 || errorData.error === 'Login necessário') {
              setUser(null);
              setCurrentView('shop');
              return null;
            }
            throw new Error(errorData.error || `Erro ${res.status}: Falha ao carregar pedidos`);
          }
          return res.json();
        })
        .then(data => {
          if (data) setMyOrders(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          if (err && err.message) {
            console.error('Erro na busca de pedidos:', err.message);
          }
          setMyOrders([]);
        })
        .finally(() => setLoadingOrders(false));
    } else if (currentView === 'admin' && user?.tipo === 'admin') {
      const handleAdminFetch = async (url: string, setter: (data: any) => void) => {
        try {
          const res = await fetch(url, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setter(data);
          } else if (res.status === 401) {
            setUser(null);
            setCurrentView('shop');
          }
        } catch (err) {
          // Falha silenciosa em admin para evitar poluição no console durante restarts
        }
      };

      handleAdminFetch(`/api/admin/pedidos?personagem=${adminPersonagemFilter}`, setAdminOrders);
      handleAdminFetch(`/api/admin/stats?personagem=${adminPersonagemFilter}`, setStats);
      handleAdminFetch('/api/admin/produtos', setAdminProducts);
      handleAdminFetch(`/api/admin/usuarios?personagem=${adminPersonagemFilter}`, setAdminUsers);
    }
  }, [currentView, user, adminSubTab, adminPersonagemFilter]);

  const refreshProducts = () => {
    fetch('/api/admin/produtos', { credentials: 'include' }).then(res => res.json()).then(data => setAdminProducts(data));
    if (currentView === 'shop') {
      fetch(`/api/produtos?personagem=${universe}`, { credentials: 'include' }).then(res => res.json()).then(data => setProducts(data));
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Deseja remover este produto?')) return;
    const res = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE', credentials: 'include' });
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
    const loginData = Object.fromEntries(formData);
    console.log('Attempting login for:', loginData.login);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginData)
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Login success - User Data:', data);
      setUser(data);
      setAuthView(null);
      if (data.tipo === 'admin') {
        console.log('User is admin, switching view to admin');
        setCurrentView('admin');
      } else {
        console.log('User is client, switching view to orders');
        setCurrentView('orders');
      }
    } else {
      console.error('Login failed with status:', res.status);
      alert('Login inválido');
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const registerData = Object.fromEntries(formData);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(registerData)
    });
    
    if (res.ok) {
      // Auto login after register
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login: registerData.login, senha: registerData.senha })
      });
      
      if (loginRes.ok) {
        const userData = await loginRes.json();
        setUser(userData);
        setAuthView(null);
        setCurrentView('orders');
      } else {
        setAuthView('login');
        alert('Cadastro realizado! Por favor, faça login.');
      }
    } else {
      alert('Erro no cadastro');
    }
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(() => {
      setUser(null);
      setMyOrders([]);
      setCurrentView('shop');
    });
  };

  const handleCheckout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCheckoutStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    const orderData = {
      cliente: user?.nome || formData.get('nome'),
      usuario_id: user?.id,
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
        credentials: 'include',
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || errorData.error === 'Login necessário') {
          setUser(null);
          setAuthView('login');
          setIsCheckoutOpen(false);
        }
        setCheckoutStatus('idle');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutStatus('idle');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
      `universe-${universe} text-zinc-900`,
      (universe === 'padilha' || universe === 'malandragem' || universe === 'all') ? "bg-white" : "bg-zinc-50"
    )}>
      {/* Global Theme Background Layer */}
      <AnimatePresence>
        {universe === 'padilha' && (
          <motion.div 
            key="padilha-global-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center p-10 md:p-40"
          >
            <img 
              src={configs.bg_padilha || "/padilha_bg.png"} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920";
                (e.target as HTMLImageElement).onerror = null;
              }}
              className="w-full h-full object-contain mix-blend-multiply"
              alt="Maria Padilha Background"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
        {universe === 'mulambo' && (
          <motion.div 
            key="mulambo-global-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center p-10 md:p-40"
          >
            <img 
              src={configs.bg_mulambo || "/mulambo_bg.png"} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&q=80&w=1920";
                (e.target as HTMLImageElement).onerror = null;
              }}
              className="w-full h-full object-contain mix-blend-multiply"
              alt="Maria Mulambo Background"
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
        "fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-3 flex justify-between items-center transition-all duration-700",
        "bg-white/80 backdrop-blur-[20px] border-b shadow-sm",
        universe === 'padilha' ? "border-[#e60000]/10" : "border-[#8a2be2]/10"
      )}>
        <div className="flex items-center gap-8">
          <button 
            onClick={() => {
              setCurrentView('shop');
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "text-xl md:text-2xl font-black uppercase tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-1.5 whitespace-nowrap",
              universe === 'padilha' ? "text-[#e60000]" : "text-[#8a2be2]"
            )}
          >
            PERFUMARIA <span className="italic">M<span className="opacity-40 italic-none mr-0.5">&</span>M</span>
          </button>
          
          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => setCurrentView('shop')} 
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] font-black transition-all",
                currentView === 'shop' ? "opacity-100 translate-y-0" : "opacity-30 hover:opacity-60 translate-y-0.5"
              )}
            >
              Catálogo
            </button>
            {user && (
              <button 
                onClick={() => setCurrentView('orders')} 
                className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-black transition-all",
                  currentView === 'orders' ? "opacity-100 translate-y-0" : "opacity-30 hover:opacity-60 translate-y-0.5"
                )}
              >
                Meus Pedidos
              </button>
            )}
            {user?.tipo === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-black text-amber-500 transition-all",
                  currentView === 'admin' ? "opacity-100 translate-y-0" : "opacity-40 hover:opacity-80 translate-y-0.5"
                )}
              >
                Painel Administrativo
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden sm:flex items-center gap-3 md:gap-5">
            {user ? (
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setCurrentView('orders')}
                   className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 rounded-2xl transition-all active:scale-95 group text-right"
                 >
                   <div className="hidden sm:flex flex-col items-end leading-none">
                     <span className="text-[9px] uppercase opacity-40 font-black tracking-widest">Meu Perfil</span>
                     <span className="text-xs font-bold text-zinc-900">{user.nome.split(' ')[0]}</span>
                   </div>
                   <div className="bg-zinc-100 p-2 rounded-xl group-hover:bg-white transition-colors">
                     <UserIcon className="w-4 h-4 text-zinc-600" />
                   </div>
                 </button>
                 <button 
                   onClick={handleLogout} 
                   className="p-2.5 hover:bg-zinc-100 rounded-2xl transition-all active:scale-95 group"
                   title="Sair"
                 >
                   <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
                 </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthView('login')} 
                className="bg-zinc-100/50 hover:bg-zinc-100 p-2.5 rounded-2xl transition-all active:scale-95 group"
              >
                <UserIcon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className={cn(
              "px-4 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center gap-3 shadow-sm",
              universe === 'padilha' ? "bg-zinc-900 text-white" : "bg-zinc-900 text-white"
            )}
          >
            <ShoppingCart className="w-4 h-4" /> 
            <span className="bg-white/20 w-px h-3" />
            <span className="font-mono">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2.5 bg-zinc-100 rounded-2xl text-zinc-900"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[160]" 
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[300px] bg-white z-[161] shadow-2xl flex flex-col p-8"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-xl font-black italic tracking-tighter">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X /></button>
              </div>

              <div className="flex flex-col gap-6">
                <button 
                   onClick={() => { setCurrentView('shop'); setIsMobileMenuOpen(false); }}
                   className={cn("text-left text-2xl font-black uppercase tracking-tighter", currentView === 'shop' ? "text-zinc-900" : "text-zinc-300")}
                >
                  Catálogo
                </button>
                {user && (
                  <button 
                    onClick={() => { setCurrentView('orders'); setIsMobileMenuOpen(false); }}
                    className={cn("text-left text-2xl font-black uppercase tracking-tighter", currentView === 'orders' ? "text-zinc-900" : "text-zinc-300")}
                  >
                    Meus Pedidos
                  </button>
                )}
                {user?.tipo === 'admin' && (
                  <button 
                    onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
                    className={cn("text-left text-2xl font-black uppercase tracking-tighter text-amber-500")}
                  >
                    Painel Admin
                  </button>
                )}
              </div>

              <div className="mt-auto pt-8 border-t border-zinc-100">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-40">Logado como</p>
                        <p className="font-bold text-sm">{user.nome}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sair da Conta
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setAuthView('login'); setIsMobileMenuOpen(false); }}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
                  >
                    Entrar / Cadastrar
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="pt-20 pb-20 min-h-screen">
        <AnimatePresence mode="wait">
          {/* SHOP VIEW */}
          {currentView === 'shop' && (
            <motion.div 
              key="shop" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-16"
            >
              {/* Universe Toggle - Sales Engineering: Emotion-Led Selection */}
              <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="text-center mb-10 space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-8 bg-zinc-200" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.6em] opacity-30 text-zinc-900">Energias de Hoje</h3>
                    <div className="h-px w-8 bg-zinc-200" />
                  </div>
                  <p className="text-lg font-black italic text-zinc-900/40 tracking-tight leading-none">Qual caminho seu olfato deseja percorrer?</p>
                    <div className="glass-morphism p-2.5 rounded-[40px] max-w-xl mx-auto text-center border-white/40 shadow-2xl relative z-10 bg-white/20 backdrop-blur-3xl">
                  <div className="grid grid-cols-2 gap-3 bg-zinc-950/5 rounded-[32px] p-2 shadow-inner">
                    {(Object.keys(UNIVERSE_CONFIG) as Universe[]).map((u) => {
                      const config = UNIVERSE_CONFIG[u];
                      const isActive = universe === u;
                      return (
                        <button
                          key={u}
                          onClick={() => setUniverse(u)}
                          className={cn(
                            "group relative py-6 text-[10px] font-black uppercase tracking-[0.3em] rounded-[28px] transition-all duration-500 h-full flex flex-col items-center justify-center text-center px-6 overflow-hidden",
                            isActive 
                              ? "text-white scale-[1.02]" 
                              : "text-zinc-400 hover:text-zinc-900 hover:bg-white/60"
                          )}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="activeUniverse"
                              className={cn("absolute inset-0 shadow-2xl", config.bg)}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                            </motion.div>
                          )}
                          <span className="relative z-10 flex items-center gap-3">
                            <span className={cn(
                              "flex items-center justify-center transition-all duration-500",
                              isActive ? "scale-110" : ""
                            )}>
                              {isActive ? (
                                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                              ) : (
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  u === 'padilha' ? "bg-red-500/30" : "bg-purple-500/30"
                                )} />
                              )}
                            </span>
                            {config.name}
                          </span>
                          {isActive && (
                            <motion.span 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative z-10 text-[7px] mt-1 opacity-60 tracking-[0.4em] italic"
                            >
                              Ativo
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </div>
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

              {/* Product Grid Section */}
              <section className="py-12">
                <div className="max-w-6xl mx-auto px-4">
                  <div className="flex flex-col items-center gap-4 text-center mb-16">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.4em] opacity-40",
                    UNIVERSE_CONFIG[universe].text
                  )}>
                    Coleção {UNIVERSE_CONFIG[universe].name}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-zinc-900">
                    {UNIVERSE_CONFIG[universe].name}
                  </h2>
                </div>
              </div>

              <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                      universe={universe}
                      onAdd={() => addToCart(product)}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </div>

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
                         {selectedProduct.categoria} • Linhagem {selectedProduct.personagem === 'padilha' ? 'Padilha' : 'Mulambo'}
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
                          UNIVERSE_CONFIG[universe].bg + " " + UNIVERSE_CONFIG[universe].shadow
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

              {loadingOrders ? (
                <div className="py-20 text-center glass-morphism rounded-[40px] flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  <p className="font-black uppercase tracking-widest text-[10px] opacity-40">Buscando sua essência...</p>
                </div>
              ) : !Array.isArray(myOrders) || myOrders.length === 0 ? (
                <div className="py-20 text-center glass-morphism rounded-[40px] opacity-40 flex flex-col items-center gap-4">
                   <Package className="w-20 h-20 opacity-20" />
                   <div className="space-y-1">
                     <p className="font-black uppercase tracking-widest text-xs">Nenhum pedido encontrado</p>
                     <p className="text-[10px] uppercase opacity-40 font-bold">Faça seu primeiro pedido ou atualize a lista</p>
                   </div>
                   <button 
                     onClick={() => {
                       if (user) {
                         setMyOrders([]);
                         fetch('/api/meus-pedidos', { credentials: 'include' })
                           .then(res => res.json())
                           .then(data => setMyOrders(Array.isArray(data) ? data : []));
                       }
                     }}
                     className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
                   >
                     Atualizar Lista
                   </button>
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
              onViewportEnter={() => console.log('Admin panel entered viewport')}
            >
              {console.log('Rendering Admin Panel, SubTab:', adminSubTab)}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-xl shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none">Comando</h2>
                    <p className="text-[10px] uppercase opacity-40 font-bold tracking-[0.2em] mt-1 italic">Gestão de Alquimia</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex bg-zinc-100 p-1 rounded-full sm:rounded-2xl shadow-inner border border-zinc-200/50 overflow-x-auto max-w-full hide-scrollbar scroll-smooth">
                    {[
                      { id: 'dashboard', label: 'Estatísticas', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                      { id: 'produtos', label: 'Estoque', icon: <Package className="w-3.5 h-3.5" /> },
                      { id: 'pedidos', label: 'Vendas', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                      { id: 'crm', label: 'Clientes', icon: <Users className="w-3.5 h-3.5" /> },
                      { id: 'config', label: 'Cores', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setAdminSubTab(tab.id as any)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-full sm:rounded-xl text-[9px] sm:text-[10px] uppercase font-black tracking-widest transition-all whitespace-nowrap min-w-[60px] sm:min-w-0",
                          adminSubTab === tab.id 
                            ? "bg-white text-zinc-900 shadow-md scale-105" 
                            : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        {tab.icon}
                        <span className="hidden xs:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200/50 sm:w-auto overflow-hidden shadow-sm">
                    <span className="text-[9px] font-black uppercase opacity-40 whitespace-nowrap">Filtro:</span>
                    <select 
                      value={adminPersonagemFilter}
                      onChange={(e) => setAdminPersonagemFilter(e.target.value)}
                      className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer flex-1"
                    >
                      <option value="todos">Todas</option>
                      <option value="padilha">Padilha</option>
                      <option value="mulambo">Mulambo</option>
                    </select>
                  </div>
                </div>
              </div>

              {adminSubTab === 'dashboard' && (
                <div className="space-y-10">
                  {/* KPI CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { 
                        label: 'Faturamento Líquido', 
                        val: stats ? `R$ ${(stats.faturamentoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Calculating...', 
                        icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
                        trend: '+12.5%',
                        color: 'bg-emerald-50'
                      },
                      { 
                        label: 'Volume de Pedidos', 
                        val: stats?.totalPedidos ?? 0, 
                        icon: <ShoppingBag className="w-5 h-5 text-blue-500" />,
                        trend: 'Mensal',
                        color: 'bg-blue-50'
                      },
                      { 
                        label: 'Conversão CRM', 
                        val: stats?.totalClientes ?? 0, 
                        icon: <Users className="w-5 h-5 text-purple-500" />,
                        trend: 'Visitantes',
                        color: 'bg-purple-50'
                      },
                      { 
                        label: 'Principal Seller', 
                        val: stats?.topProdutos?.[0]?.n || 'N/A', 
                        icon: <Star className="w-5 h-5 text-amber-500" />,
                        trend: stats?.topProdutos?.[0]?.q ? `${stats.topProdutos[0].q} un.` : '-',
                        color: 'bg-amber-50'
                      }
                    ].map((kpi, idx) => (
                      <div key={idx} className="glass-morphism p-8 rounded-[40px] border-zinc-200 shadow-sm space-y-6 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                          <div className={cn("p-4 rounded-2xl shadow-sm", kpi.color)}>
                            {kpi.icon}
                          </div>
                          <span className={cn(
                            "text-[10px] font-black px-3 py-1 rounded-full",
                            kpi.trend.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          )}>
                            {kpi.trend}
                          </span>
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] mb-1">{kpi.label}</p>
                          <h4 className="text-3xl font-black italic tracking-tighter text-zinc-900 truncate">{kpi.val}</h4>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-zinc-100/50 rounded-full blur-3xl group-hover:bg-zinc-200/50 transition-colors" />
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
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Mulambo</div>
                            <span>{Math.round((stats?.faturamentoPorPersonagem?.find(p => p.p === 'mulambo')?.v || 0) / (stats?.faturamentoTotal || 1) * 100)}%</span>
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

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 border border-zinc-200">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase italic leading-none">Novidades</h4>
                        <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest mt-1">Dicas de Gestão</p>
                      </div>
                    </div>
                    <div className="glass-morphism p-8 rounded-[40px] border border-zinc-100 shadow-sm bg-gradient-to-br from-white to-zinc-50">
                       <p className="text-xs font-medium text-zinc-600 leading-relaxed italic">
                         "Toda fragrância conta uma história. Mantenha seu estoque sempre atualizado e utilize fotos de alta qualidade (links externos) para encantar seus clientes."
                       </p>
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
                    {filteredAdminProducts.map(product => (
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
                  {/* Mobile Cards for Pedidos */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredAdminOrders.map(order => (
                      <div key={order.id} className="glass-morphism p-6 rounded-[32px] space-y-4 shadow-sm border border-zinc-100">
                        <div className="flex justify-between items-start">
                           <div>
                             <p className="text-[10px] font-black opacity-30 uppercase">ID: #{order.id}</p>
                             <p className="font-bold text-lg leading-tight mt-1">{order.cliente}</p>
                           </div>
                           <StatusBadge status={order.status} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="opacity-60">{new Date(order.data).toLocaleDateString()}</span>
                           <span className="font-black text-sm">R$ {order.total.toFixed(2)}</span>
                        </div>
                        <div className="pt-2">
                           <select 
                             value={order.status}
                             onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                             className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none focus:border-zinc-400 appearance-none shadow-sm"
                           >
                             <option value="pendente">Pendente</option>
                             <option value="pago">Pago</option>
                             <option value="enviado">Enviado</option>
                             <option value="entregue">Entregue</option>
                           </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table for Pedidos */}
                  <div className="hidden md:block overflow-x-auto rounded-[32px] glass-morphism border border-zinc-100 shadow-sm relative z-0">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-zinc-100">
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">ID</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Cliente</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Data</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Valor</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Status</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30 text-right">Ação</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-100">
                          {filteredAdminOrders.map(order => (
                            <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                              <td className="p-6 text-sm font-bold opacity-40">#{order.id}</td>
                              <td className="p-6 text-sm font-bold">{order.cliente}</td>
                              <td className="p-6 text-xs font-medium opacity-60">{new Date(order.data).toLocaleString()}</td>
                              <td className="p-6 text-sm font-black">R$ {order.total.toFixed(2)}</td>
                              <td className="p-6"><StatusBadge status={order.status} /></td>
                              <td className="p-6 text-right">
                                 <select 
                                   value={order.status}
                                   onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                   className="bg-white border border-zinc-200 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase focus:outline-none focus:border-zinc-400 cursor-pointer shadow-sm"
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
                  {/* Mobile Cards for CRM */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredAdminUsers.map(u => (
                      <div key={u.id} className="glass-morphism p-6 rounded-[32px] space-y-4 shadow-sm border border-zinc-100">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-tighter border border-zinc-200 shadow-sm">
                              {u.nome.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold leading-none">{u.nome}</p>
                              <p className="text-[10px] opacity-40 uppercase font-black mt-1">{u.login}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 text-center">
                               <p className="text-[8px] uppercase font-black opacity-30">Pedidos</p>
                               <p className="text-sm font-black italic">{u.total_pedidos || 0}</p>
                            </div>
                            <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 text-center">
                               <p className="text-[8px] uppercase font-black opacity-30">Investimento</p>
                               <p className="text-sm font-black italic text-green-600">R$ {(u.total_gasto || 0).toFixed(2)}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table for CRM */}
                  <div className="hidden md:block overflow-x-auto rounded-[32px] glass-morphism border border-zinc-100">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-zinc-100">
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Cliente</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Login</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Vendas</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30">Total Gasto</th>
                           <th className="p-6 text-[10px] uppercase font-black opacity-30 text-right">Perfil</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-100">
                          {filteredAdminUsers.map(u => (
                            <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors group">
                               <td className="p-6">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-tighter border border-zinc-200">
                                     {u.nome.substring(0, 2)}
                                   </div>
                                   <span className="text-sm font-bold">{u.nome}</span>
                                 </div>
                               </td>
                               <td className="p-6 text-sm font-bold opacity-40">{u.login}</td>
                               <td className="p-6 text-sm font-black">{u.total_pedidos}</td>
                               <td className="p-6 text-sm font-black text-green-600">R$ {(u.total_gasto || 0).toFixed(2)}</td>
                               <td className="p-6 text-right text-[10px] uppercase font-bold opacity-30 italic">Ativo</td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>
                </div>
              )}

              {adminSubTab === 'config' && (
                <div className="space-y-12 pb-20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Customização do Ambiente</h3>
                      <p className="text-[10px] font-bold uppercase opacity-30 tracking-[0.2em]">Defina as artes de fundo de cada linhagem</p>
                    </div>
                    <LayoutDashboard className="w-8 h-8 opacity-10" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { id: 'padilha', label: 'Maria Padilha', configKey: 'bg_padilha' },
                      { id: 'mulambo', label: 'Maria Mulambo', configKey: 'bg_mulambo' }
                    ].map(lin => (
                      <div key={lin.id} className="glass-morphism p-6 sm:p-8 rounded-[40px] border-zinc-200 space-y-8 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", lin.id === 'padilha' ? 'bg-red-500 shadow-red-200/50 shadow-lg' : 'bg-purple-500 shadow-purple-200/50 shadow-lg')}>
                            {lin.id === 'padilha' ? <Zap className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-black uppercase italic text-lg leading-none">{lin.label}</h4>
                            <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest mt-1">Identidade Visual</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-black opacity-30 tracking-widest">URL da Imagem de Fundo</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                             <input 
                               type="text" 
                               value={configs[lin.configKey] || ''} 
                               onChange={(e) => setConfigs({ ...configs, [lin.configKey]: e.target.value })}
                               className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400 text-sm font-medium"
                               placeholder="Link da imagem..."
                             />
                             <button 
                               onClick={async () => {
                                  const res = await fetch('/api/configuracoes', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chave: lin.configKey, valor: configs[lin.configKey] })
                                  });
                                  if (res.ok) setToast({ productName: `Layout ${lin.label} salvo!` });
                               }}
                               className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg active:scale-95"
                             >
                               Salvar
                             </button>
                          </div>
                        </div>
                        
                        <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-100 bg-zinc-50 relative group shadow-inner">
                          <img 
                            src={configs[lin.configKey] || (lin.id === 'padilha' ? "/padilha_bg.png" : "/mulambo_bg.png")} 
                            className="w-full h-full object-contain mix-blend-multiply opacity-50"
                          />
                          <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                             <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] scale-90 group-hover:scale-100 transition-transform text-center">Preview em Tempo Real</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="glass-morphism p-6 sm:p-10 rounded-[40px] border-zinc-200 space-y-10 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase italic text-lg leading-none">Redes Sociais & Links</h4>
                        <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest mt-1">Conecte sua presença digital</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { key: 'social_instagram', label: 'Instagram (URL)', placeholder: 'https://instagram.com/...' },
                        { key: 'social_tiktok', label: 'TikTok (URL)', placeholder: 'https://tiktok.com/@...' },
                        { key: 'social_bio', label: 'Link da Bio / WhatsApp', placeholder: 'https://wa.me/...' }
                      ].map(social => (
                        <div key={social.key} className="space-y-3">
                          <label className="text-[10px] uppercase font-black opacity-30 tracking-widest">{social.label}</label>
                          <div className="flex flex-col gap-2">
                             <input 
                               type="text" 
                               value={configs[social.key] || ''} 
                               onChange={(e) => setConfigs({ ...configs, [social.key]: e.target.value })}
                               className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400 text-sm"
                               placeholder={social.placeholder}
                             />
                             <button 
                               onClick={async () => {
                                  const res = await fetch('/api/configuracoes', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chave: social.key, valor: configs[social.key] })
                                  });
                                  if (res.ok) setToast({ productName: `${social.label.split(' ')[0]} salvo!` });
                               }}
                               className="bg-zinc-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-md active:scale-95"
                             >
                               Atualizar
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer universe={universe} configs={configs} />

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
                    
                    {authView === 'login' && (
                      <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Dica Admin</p>
                        <p className="text-[10px] font-medium text-zinc-500">Usuário: <span className="font-bold text-zinc-900">leticiaadm</span></p>
                        <p className="text-[10px] font-medium text-zinc-500">Senha: <span className="font-bold text-zinc-900 italic">30031936</span></p>
                      </div>
                    )}
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
                             UNIVERSE_CONFIG[universe].text
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
                          UNIVERSE_CONFIG[universe].text
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
                UNIVERSE_CONFIG[universe].bg + " " + UNIVERSE_CONFIG[universe].shadow + " text-white"
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
                         credentials: 'include',
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

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">URL da Imagem</label>
                        <input 
                          required 
                          name="imagem" 
                          defaultValue={editingProduct?.imagem} 
                          placeholder="https://..." 
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400"
                          onChange={(e) => {
                            const imgPreview = document.getElementById('product-img-preview') as HTMLImageElement;
                            if (imgPreview) imgPreview.src = e.target.value;
                          }}
                        />
                      </div>
                      <div className="aspect-square w-32 mx-auto rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-inner">
                        <img 
                          id="product-img-preview"
                          src={editingProduct?.imagem || 'https://placehold.co/400x400/f4f4f5/71717a?text=Preview'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f4f4f5/ef4444?text=Erro+no+Link';
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Categoria</label>
                        <input required name="categoria" defaultValue={editingProduct?.categoria} placeholder="Ex: Eau de Parfum" className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-black opacity-30 text-zinc-900">Linhagem do Perfil</label>
                        <select name="personagem" defaultValue={editingProduct?.personagem || 'padilha'} className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-zinc-400 appearance-none text-zinc-900">
                          <option value="padilha" className="bg-white border-none">🍷 Maria Padilha (Aurea Vermelha)</option>
                          <option value="mulambo" className="bg-white border-none">💜 Maria Mulambo (Místico Roxo)</option>
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
