import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const dbPath = process.env.DATABASE_PATH || 'ecommerce.db';
const db = new Database(dbPath);

// --- AUTO-MIGRATION LOGIC ---
const tableInfoUsuarios = db.prepare("PRAGMA table_info(usuarios)").all() as any[];
const columnExists = (cols: any[], name: string) => cols.some(c => c.name === name);

if (tableInfoUsuarios.length > 0) {
    if (columnExists(tableInfoUsuarios, 'email')) {
        db.exec("ALTER TABLE usuarios RENAME COLUMN email TO login");
    } else if (columnExists(tableInfoUsuarios, 'telefone')) {
        db.exec("ALTER TABLE usuarios RENAME COLUMN telefone TO login");
    }
}

const tableInfoPedidos = db.prepare("PRAGMA table_info(pedidos)").all() as any[];

if (tableInfoPedidos.length > 0) {
  if (!columnExists(tableInfoPedidos, 'usuario_id')) {
    db.exec("ALTER TABLE pedidos ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id)");
  }
  if (!columnExists(tableInfoPedidos, 'status')) {
    db.exec("ALTER TABLE pedidos ADD COLUMN status TEXT DEFAULT 'pendente'");
  }
}

const tableInfoItens = db.prepare("PRAGMA table_info(itens_pedido)").all() as any[];
if (tableInfoItens.length > 0) {
  if (!columnExists(tableInfoItens, 'preco_unitario')) {
    db.exec("ALTER TABLE itens_pedido ADD COLUMN preco_unitario REAL");
  }
}
// -----------------------------

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT DEFAULT 'cliente' -- 'cliente' or 'admin'
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    imagem TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    personagem TEXT NOT NULL -- 'padilha' or 'mulamba'
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    cliente TEXT NOT NULL, -- nome do cliente para histórico
    total REAL NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'enviado', 'entregue'
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
  );

  CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario REAL NOT NULL, -- preço no momento da compra
    FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY(produto_id) REFERENCES produtos(id)
  );
`);

// Seed data
const testProductResult = db.prepare('SELECT COUNT(*) as count FROM produtos').get() as any;
const productCount = testProductResult?.count || 0;

if (productCount < 5) {
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO produtos (nome, preco, imagem, descricao, categoria, personagem)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Sedução Escarlate', 189.90, 'https://picsum.photos/seed/padilha1/400/600', 'Um perfume intenso com notas de rosas vermelhas e pimenta.', 'Eau de Parfum', 'padilha'],
    ['Mistério da Noite', 210.00, 'https://picsum.photos/seed/padilha2/400/600', 'Fragrância marcante com toques de couro e baunilha negra.', 'Intense', 'padilha'],
    ['Chama Ardente', 175.50, 'https://picsum.photos/seed/padilha3/400/600', 'Notas vibrantes de canela e âmbar.', 'Luminous', 'padilha'],
    ['Rainha das Almas', 250.00, 'https://picsum.photos/seed/padilha4/400/600', 'O topo da sofisticação e poder feminino.', 'Premium', 'padilha'],
    ['Dama da Noite', 198.00, 'https://picsum.photos/seed/padilha5/400/600', 'Floral intenso com notas de jasmim e mistério.', 'Eau de Parfum', 'padilha'],
    ['Poder Escarlate', 215.00, 'https://picsum.photos/seed/padilha6/400/600', 'Uma explosão de especiarias e sedução.', 'Intense', 'padilha'],
    ['Pérola Negra', 245.00, 'https://picsum.photos/seed/padilha7/400/600', 'Sofisticado e envolvente como uma noite estrelada.', 'Exclusivo', 'padilha'],
    ['Véu Místico', 195.00, 'https://picsum.photos/seed/mulamba1/400/600', 'Fragrância etérea com notas de lavanda mística e incenso.', 'Eau de Parfum', 'mulamba'],
    ['Segredo Roxo', 180.00, 'https://picsum.photos/seed/mulamba2/400/600', 'Toques de ametista e orquídea selvagem.', 'Floral', 'mulamba'],
    ['Essência da Estrada', 165.00, 'https://picsum.photos/seed/mulamba3/400/600', 'Notas terrosas combinadas com patchouli.', 'Ancestral', 'mulamba'],
    ['Magia Oculta', 230.00, 'https://picsum.photos/seed/mulamba4/400/600', 'Um aroma complexo que revela novos segredos a cada hora.', 'Exclusivo', 'mulamba'],
    ['Raízes Sagradas', 185.00, 'https://picsum.photos/seed/mulamba5/400/600', 'A força da natureza em um frasco purpúreo.', 'Natural', 'mulamba'],
    ['Encanto Cigano', 192.00, 'https://picsum.photos/seed/mulamba6/400/600', 'Liberdade e frescor com toques frutados.', 'Eau de Toilette', 'mulamba'],
    ['Luar De Prata', 210.00, 'https://picsum.photos/seed/mulamba7/400/600', 'Brilho e serenidade para os rituais modernos.', 'Luminous', 'mulamba'],
  ];

  for (const p of products) {
    // Check by name to avoid duplicates if count was slightly above 0 but below 5
    const exists = db.prepare('SELECT id FROM produtos WHERE nome = ?').get(p[0]);
    if (!exists) {
      insertProduct.run(...p);
    }
  }
}

// Seed admin
const adminExists = db.prepare('SELECT * FROM usuarios WHERE login = ?').get('leticiaadm');
if (!adminExists) {
  const hashed = bcrypt.hashSync('30031936', 10);
  db.prepare('INSERT INTO usuarios (nome, login, senha, tipo) VALUES (?, ?, ?, ?)')
    .run('Leticia Admin', 'leticiaadm', hashed, 'admin');
}

// Seed mock orders for dashboard if empty
const orderCount = (db.prepare('SELECT COUNT(*) as count FROM pedidos').get() as any).count;
if (orderCount === 0) {
  const adminDoc = db.prepare('SELECT id FROM usuarios WHERE login = ?').get('leticiaadm') as any;
  const insertOrder = db.prepare('INSERT INTO pedidos (usuario_id, cliente, total, status, data) VALUES (?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');

  // Past 7 days
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString();
    
    // Random products
    const pId = Math.floor(Math.random() * 8) + 1;
    const prod = db.prepare('SELECT * FROM produtos WHERE id = ?').get(pId) as any;
    const qty = Math.floor(Math.random() * 3) + 1;
    const total = prod.preco * qty;
    
    const info = insertOrder.run(adminDoc.id, 'Cliente Simulado', total, 'pago', dateStr);
    insertItem.run(info.lastInsertRowid, pId, qty, prod.preco);
  }
}

export default db;
