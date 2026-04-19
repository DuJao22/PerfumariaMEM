export type Universe = 'padilha' | 'mulamba';

export interface Product {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  descricao: string;
  categoria: string;
  personagem: Universe;
}

export interface CartItem extends Product {
  quantity: number;
  preco_unitario: number; // For purchase time locking
}

export interface User {
  id: number;
  nome: string;
  tipo: 'cliente' | 'admin';
}

export interface OrderItem {
  id: number;
  pedido_id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  nome: string;
  imagem: string;
}

export interface Order {
  id: number;
  cliente: string;
  total: number;
  status: 'pendente' | 'pago' | 'enviado' | 'entregue';
  data: string;
  itens: OrderItem[];
}

export interface DashboardStats {
  faturamentoTotal: number;
  totalPedidos: number;
  totalClientes: number;
  faturamentoPorDia: { d: string; t: number }[];
  faturamentoPorPersonagem: { p: string; v: number }[];
  topProdutos: { n: string; q: number }[];
}
