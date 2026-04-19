import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import db from './database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module 'express-session' {
  interface SessionData {
    userId: number;
    userTipo: string;
    userNome: string;
  }
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(session({
    secret: 'perfume-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // AIS environment doesn't use https in dev preview usually
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    }
  }));

  // Auth API
  app.post('/api/register', (req, res) => {
    const { nome, login, senha } = req.body;
    try {
      const hashed = bcrypt.hashSync(senha, 10);
      const info = db.prepare('INSERT INTO usuarios (nome, login, senha) VALUES (?, ?, ?)')
        .run(nome, login, hashed);
      res.status(201).json({ id: info.lastInsertRowid, message: 'Usuário criado' });
    } catch (error) {
      res.status(400).json({ error: 'Este login já está em uso' });
    }
  });

  app.post('/api/login', (req, res) => {
    const { login, senha } = req.body;
    const user = db.prepare('SELECT * FROM usuarios WHERE login = ?').get(login) as any;
    if (user && bcrypt.compareSync(senha, user.senha)) {
      req.session.userId = user.id;
      req.session.userTipo = user.tipo;
      req.session.userNome = user.nome;
      res.json({ id: user.id, nome: user.nome, tipo: user.tipo });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logout realizado' });
    });
  });

  app.get('/api/me', (req, res) => {
    if (req.session.userId) {
      res.json({ id: req.session.userId, nome: req.session.userNome, tipo: req.session.userTipo });
    } else {
      res.status(401).json({ error: 'Não autenticado' });
    }
  });

  // Shop API
  app.get('/api/produtos', (req, res) => {
    const { personagem } = req.query;
    let products;
    if (personagem) {
      products = db.prepare('SELECT * FROM produtos WHERE personagem = ?').all(personagem);
    } else {
      products = db.prepare('SELECT * FROM produtos').all();
    }
    res.json(products);
  });

  app.get('/api/meus-pedidos', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Login necessário' });
    
    const pedidos = db.prepare('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data DESC')
      .all(req.session.userId) as any[];
      
    const results = pedidos.map(p => {
      const itens = db.prepare(`
        SELECT ip.*, p.nome, p.imagem 
        FROM itens_pedido ip 
        JOIN produtos p ON ip.produto_id = p.id 
        WHERE ip.pedido_id = ?
      `).all(p.id);
      return { ...p, itens };
    });
    
    res.json(results);
  });

  app.post('/api/pedidos', (req, res) => {
    const { cliente, total, itens } = req.body;
    const usuario_id = req.session.userId || null;
    
    try {
      const insertPedido = db.prepare('INSERT INTO pedidos (usuario_id, cliente, total) VALUES (?, ?, ?)');
      const insertItem = db.prepare('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');

      const transaction = db.transaction(() => {
        const info = insertPedido.run(usuario_id, cliente, total);
        const pedidoId = info.lastInsertRowid;

        for (const item of itens) {
          insertItem.run(pedidoId, item.produto_id, item.quantidade, item.preco_unitario);
        }
        return pedidoId;
      });

      const pedidoId = transaction();
      io.emit('novo_pedido', { id: pedidoId, cliente, total, data: new Date().toISOString() });
      res.status(201).json({ id: pedidoId, message: 'Pedido realizado com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao processar pedido' });
    }
  });

  // Admin API
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.session.userTipo === 'admin') next();
    else res.status(403).json({ error: 'Acesso negado' });
  };

  app.get('/api/admin/pedidos', isAdmin, (req, res) => {
    const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY data DESC').all() as any[];
    const results = pedidos.map(p => {
      const itens = db.prepare(`
        SELECT ip.*, p.nome, p.imagem 
        FROM itens_pedido ip 
        JOIN produtos p ON ip.produto_id = p.id 
        WHERE ip.pedido_id = ?
      `).all(p.id);
      return { ...p, itens };
    });
    res.json(results);
  });

  app.patch('/api/admin/pedidos/:id/status', isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE pedidos SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Status atualizado' });
  });

  app.get('/api/admin/stats', isAdmin, (req, res) => {
    try {
      const faturamentoTotalResult = db.prepare('SELECT SUM(total) as total FROM pedidos WHERE status = "pago"').get() as any;
      const faturamentoTotal = Number(faturamentoTotalResult?.total || 0);
      
      const totalPedidosResult = db.prepare('SELECT COUNT(*) as count FROM pedidos').get() as any;
      const totalPedidos = Number(totalPedidosResult?.count || 0);
      
      const totalClientesResult = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE tipo = "cliente"').get() as any;
      const totalClientes = Number(totalClientesResult?.count || 0);
      
      const faturamentoPorDia = db.prepare(`
        SELECT strftime('%d/%m', data) as d, SUM(total) as t 
        FROM pedidos 
        WHERE status = "pago"
        GROUP BY d 
        ORDER BY data ASC 
        LIMIT 10
      `).all() || [];

      const faturamentoPorPersonagem = db.prepare(`
        SELECT p.personagem as p, SUM(ip.quantidade * ip.preco_unitario) as v
        FROM itens_pedido ip
        JOIN produtos p ON ip.produto_id = p.id
        JOIN pedidos ord ON ip.pedido_id = ord.id
        WHERE ord.status = "pago"
        GROUP BY p.personagem
      `).all() || [];

      const topProdutosRaw = db.prepare(`
        SELECT p.nome as n, SUM(ip.quantidade) as q
        FROM itens_pedido ip
        JOIN produtos p ON ip.produto_id = p.id
        GROUP BY p.id
        ORDER BY q DESC
        LIMIT 5
      `).all() || [];

      res.json({
        faturamentoTotal,
        totalPedidos,
        totalClientes,
        faturamentoPorDia,
        faturamentoPorPersonagem,
        topProdutos: topProdutosRaw
      });
    } catch (error) {
      console.error('Stats Error:', error);
      res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
  });

  // Admin Products CRUD
  app.get('/api/admin/produtos', isAdmin, (req, res) => {
    const products = db.prepare('SELECT * FROM produtos ORDER BY id DESC').all();
    res.json(products);
  });

  app.post('/api/admin/produtos', isAdmin, (req, res) => {
    const { nome, preco, imagem, descricao, categoria, personagem } = req.body;
    const info = db.prepare(`
      INSERT INTO produtos (nome, preco, imagem, descricao, categoria, personagem)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nome, preco, imagem, descricao, categoria, personagem);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.put('/api/admin/produtos/:id', isAdmin, (req, res) => {
    const { nome, preco, imagem, descricao, categoria, personagem } = req.body;
    db.prepare(`
      UPDATE produtos 
      SET nome = ?, preco = ?, imagem = ?, descricao = ?, categoria = ?, personagem = ?
      WHERE id = ?
    `).run(nome, preco, imagem, descricao, categoria, personagem, req.params.id);
    res.json({ message: 'Produto atualizado' });
  });

  app.delete('/api/admin/produtos/:id', isAdmin, (req, res) => {
    db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Produto removido' });
  });

  // Admin Users (CRM)
  app.get('/api/admin/usuarios', isAdmin, (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.nome, u.login, u.tipo, 
             COUNT(p.id) as total_pedidos,
             SUM(p.total) as total_gasto
      FROM usuarios u
      LEFT JOIN pedidos p ON u.id = p.usuario_id
      WHERE u.tipo = 'cliente'
      GROUP BY u.id
      ORDER BY total_gasto DESC
    `).all();
    res.json(users);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Para a Vercel suportar o servidor Express
export const appPromise = startServer();
export default (req: any, res: any) => {
  // Isso é um fallback caso a Vercel tente chamar o arquivo como uma função direta
  startServer().then(() => {
    // Note: Em produção real na Vercel, o ideal é mover a lógica para /api/index.ts
  });
};
