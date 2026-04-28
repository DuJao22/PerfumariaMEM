import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import db, { initDb } from './database.ts';

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
  await initDb();
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.set('trust proxy', 1);
  app.use(session({
    secret: 'perfume-secret-key-123',
    resave: false,
    saveUninitialized: false,
    name: 'perfume_session',
    cookie: { 
      secure: true, 
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      sameSite: 'none',
      httpOnly: true
    }
  }));

  // Auth API
  app.post('/api/register', async (req, res) => {
    const { nome, login, senha } = req.body;
    try {
      const hashed = bcrypt.hashSync(senha, 10);
      const info = await db.sql('INSERT INTO usuarios (nome, login, senha) VALUES (?, ?, ?)', nome, login, hashed);
      res.status(201).json({ id: info.lastInsertRowid, message: 'Usuário criado' });
    } catch (error) {
      res.status(400).json({ error: 'Este login já está em uso' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { login, senha } = req.body;
    const users = await db.sql('SELECT * FROM usuarios WHERE login = ?', login) as any[];
    const user = users[0];
    if (user && bcrypt.compareSync(senha, user.senha)) {
      req.session.userId = user.id;
      req.session.userTipo = user.tipo;
      req.session.userNome = user.nome;
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Erro ao iniciar sessão' });
        }
        res.json({ id: user.id, nome: user.nome, tipo: user.tipo });
      });
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
  app.get('/api/produtos', async (req, res) => {
    const { personagem } = req.query;
    let products;
    if (personagem) {
      products = await db.sql('SELECT * FROM produtos WHERE personagem = ?', personagem);
    } else {
      products = await db.sql('SELECT * FROM produtos');
    }
    res.json(products);
  });

  app.get('/api/meus-pedidos', async (req, res) => {
    console.log('Fetching orders for session:', req.session.userId);
    if (!req.session.userId) return res.status(401).json({ error: 'Login necessário' });
    
    const pedidos = await db.sql('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY data DESC', req.session.userId) as any[];
      
    const results = await Promise.all(pedidos.map(async (p) => {
      const itens = await db.sql(`
        SELECT ip.*, p.nome, p.imagem, p.personagem
        FROM itens_pedido ip 
        JOIN produtos p ON ip.produto_id = p.id 
        WHERE ip.pedido_id = ?
      `, p.id);
      return { ...p, itens };
    }));
    res.json(results);
  });

  app.post('/api/pedidos', async (req, res) => {
    const { cliente, total, itens, usuario_id: body_usuario_id } = req.body;
    const usuario_id = req.session.userId || body_usuario_id || null;
    
    try {
      const info = await db.sql('INSERT INTO pedidos (usuario_id, cliente, total) VALUES (?, ?, ?)', usuario_id, cliente, total);
      const pedidoId = info.lastInsertRowid;

      for (const item of itens) {
        await db.sql('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)', 
          pedidoId, item.produto_id, item.quantidade, item.preco_unitario);
      }

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

  app.get('/api/admin/pedidos', isAdmin, async (req, res) => {
    const { personagem } = req.query;
    try {
      const isFiltered = personagem && personagem !== 'todos';
      let query = 'SELECT * FROM pedidos ORDER BY data DESC';
      const params = [];

      if (isFiltered) {
        query = `
          SELECT DISTINCT ord.* 
          FROM pedidos ord
          JOIN itens_pedido ip ON ord.id = ip.pedido_id
          JOIN produtos p ON ip.produto_id = p.id
          WHERE p.personagem = ?
          ORDER BY ord.data DESC
        `;
        params.push(personagem);
      }

      const pedidos = await db.sql(query, ...params) as any[];
      const results = await Promise.all(pedidos.map(async (p) => {
        const itens = await db.sql(`
          SELECT ip.*, p.nome, p.imagem, p.personagem
          FROM itens_pedido ip 
          JOIN produtos p ON ip.produto_id = p.id 
          WHERE ip.pedido_id = ?
        `, p.id);
        return { ...p, itens };
      }));
      res.json(results);
    } catch (error) {
      console.error('Admin Pedidos Filter Error:', error);
      res.status(500).json({ error: 'Erro ao carregar pedidos' });
    }
  });

  app.patch('/api/admin/pedidos/:id/status', isAdmin, async (req, res) => {
    const { status } = req.body;
    await db.sql('UPDATE pedidos SET status = ? WHERE id = ?', status, req.params.id);
    res.json({ message: 'Status atualizado' });
  });

  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    const { personagem } = req.query;
    try {
      const isFiltered = personagem && personagem !== 'todos';
      const pParam = isFiltered ? [personagem] : [];

      // Faturamento Total
      let faturamentoQuery = 'SELECT SUM(total) as total FROM pedidos WHERE status = "pago"';
      if (isFiltered) {
        faturamentoQuery = `
          SELECT SUM(ip.quantidade * ip.preco_unitario) as total 
          FROM itens_pedido ip 
          JOIN produtos p ON ip.produto_id = p.id 
          JOIN pedidos ord ON ip.pedido_id = ord.id 
          WHERE ord.status = "pago" AND p.personagem = ?
        `;
      }
      const faturamentoTotalResult = await db.sql(faturamentoQuery, ...pParam) as any[];
      const faturamentoTotal = Number(faturamentoTotalResult[0]?.total || 0);
      
      // Total Pedidos
      let pedidosQuery = 'SELECT COUNT(*) as count FROM pedidos';
      if (isFiltered) {
        pedidosQuery = `
          SELECT COUNT(DISTINCT ip.pedido_id) as count 
          FROM itens_pedido ip 
          JOIN produtos p ON ip.produto_id = p.id 
          WHERE p.personagem = ?
        `;
      }
      const totalPedidosResult = await db.sql(pedidosQuery, ...pParam) as any[];
      const totalPedidos = Number(totalPedidosResult[0]?.count || 0);
      
      // Total Clientes
      let clientesQuery = 'SELECT COUNT(*) as count FROM usuarios WHERE tipo = "cliente"';
      if (isFiltered) {
        clientesQuery = `
          SELECT COUNT(DISTINCT ord.usuario_id) as count 
          FROM itens_pedido ip 
          JOIN produtos p ON ip.produto_id = p.id 
          JOIN pedidos ord ON ip.pedido_id = ord.id 
          WHERE p.personagem = ? AND ord.usuario_id IS NOT NULL
        `;
      }
      const totalClientesResult = await db.sql(clientesQuery, ...pParam) as any[];
      const totalClientes = Number(totalClientesResult[0]?.count || 0);
      
      // Faturamento Por Dia
      let faturamentoDiaQuery = `
        SELECT strftime('%d/%m', data) as d, SUM(total) as t 
        FROM pedidos 
        WHERE status = "pago"
        GROUP BY d 
        ORDER BY data ASC 
        LIMIT 10
      `;
      if (isFiltered) {
        faturamentoDiaQuery = `
          SELECT strftime('%d/%m', ord.data) as d, SUM(ip.quantidade * ip.preco_unitario) as t 
          FROM itens_pedido ip 
          JOIN produtos p ON ip.produto_id = p.id 
          JOIN pedidos ord ON ip.pedido_id = ord.id 
          WHERE ord.status = "pago" AND p.personagem = ?
          GROUP BY d 
          ORDER BY ord.data ASC 
          LIMIT 10
        `;
      }
      const faturamentoPorDia = await db.sql(faturamentoDiaQuery, ...pParam) || [];

      // Faturamento Por Personagem
      const faturamentoPorPersonagem = await db.sql(`
        SELECT p.personagem as p, SUM(ip.quantidade * ip.preco_unitario) as v
        FROM itens_pedido ip
        JOIN produtos p ON ip.produto_id = p.id
        JOIN pedidos ord ON ip.pedido_id = ord.id
        WHERE ord.status = "pago"
        GROUP BY p.personagem
      `) || [];

      // Top Produtos
      let topProdutosQuery = `
        SELECT p.nome as n, SUM(ip.quantidade) as q
        FROM itens_pedido ip
        JOIN produtos p ON ip.produto_id = p.id
        GROUP BY p.id
        ORDER BY q DESC
        LIMIT 5
      `;
      if (isFiltered) {
        topProdutosQuery = `
          SELECT p.nome as n, SUM(ip.quantidade) as q
          FROM itens_pedido ip
          JOIN produtos p ON ip.produto_id = p.id
          WHERE p.personagem = ?
          GROUP BY p.id
          ORDER BY q DESC
          LIMIT 5
        `;
      }
      const topProdutosRaw = await db.sql(topProdutosQuery, ...pParam) || [];

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
  app.get('/api/admin/produtos', isAdmin, async (req, res) => {
    const products = await db.sql('SELECT * FROM produtos ORDER BY id DESC');
    res.json(products);
  });

  app.post('/api/admin/produtos', isAdmin, async (req, res) => {
    const { nome, preco, imagem, descricao, categoria, personagem } = req.body;
    const info = await db.sql(`
      INSERT INTO produtos (nome, preco, imagem, descricao, categoria, personagem)
      VALUES (?, ?, ?, ?, ?, ?)
    `, nome, preco, imagem, descricao, categoria, personagem);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  app.put('/api/admin/produtos/:id', isAdmin, async (req, res) => {
    const { nome, preco, imagem, descricao, categoria, personagem } = req.body;
    await db.sql(`
      UPDATE produtos 
      SET nome = ?, preco = ?, imagem = ?, descricao = ?, categoria = ?, personagem = ?
      WHERE id = ?
    `, nome, preco, imagem, descricao, categoria, personagem, req.params.id);
    res.json({ message: 'Produto atualizado' });
  });

  app.delete('/api/admin/produtos/:id', isAdmin, async (req, res) => {
    await db.sql('DELETE FROM produtos WHERE id = ?', req.params.id);
    res.json({ message: 'Produto removido' });
  });

  // Admin Users (CRM)
  app.get('/api/admin/usuarios', isAdmin, async (req, res) => {
    const { personagem } = req.query;
    try {
      const isFiltered = personagem && personagem !== 'todos';
      let query = `
        SELECT u.id, u.nome, u.login, u.tipo, 
               COUNT(DISTINCT p.id) as total_pedidos,
               SUM(p.total) as total_gasto
        FROM usuarios u
        LEFT JOIN pedidos p ON u.id = p.usuario_id
        WHERE u.tipo = 'cliente'
      `;
      
      const params = [];
      if (isFiltered) {
        query = `
          SELECT u.id, u.nome, u.login, u.tipo, 
                 COUNT(DISTINCT p.id) as total_pedidos,
                 SUM(ip.quantidade * ip.preco_unitario) as total_gasto
          FROM usuarios u
          JOIN pedidos p ON u.id = p.usuario_id
          JOIN itens_pedido ip ON p.id = ip.pedido_id
          JOIN produtos prod ON ip.produto_id = prod.id
          WHERE u.tipo = 'cliente' AND prod.personagem = ?
        `;
        params.push(personagem);
      }
      
      query += ` GROUP BY u.id ORDER BY total_gasto DESC`;
      
      const users = await db.sql(query, ...params);
      res.json(users);
    } catch (error) {
      console.error('CRM Filter Error:', error);
      res.status(500).json({ error: 'Erro ao carregar base de clientes' });
    }
  });

  // Configurações (Backgrounds, etc)
  app.get('/api/configuracoes', async (req, res) => {
    try {
      const config = await db.sql('SELECT * FROM configuracoes') as any[];
      const configMap = (config as { chave: string, valor: string }[]).reduce((acc, curr) => {
        acc[curr.chave] = curr.valor;
        return acc;
      }, {} as Record<string, string>);
      res.json(configMap);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
  });

  app.post('/api/configuracoes', express.json(), isAdmin, async (req, res) => {
    const { chave, valor } = req.body;
    if (!chave || !valor) return res.status(400).json({ error: 'Chave e valor obrigatórios' });
    
    try {
      await db.sql('INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)', chave, valor);
      res.json({ success: true, message: 'Configuração atualizada' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar configuração' });
    }
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
