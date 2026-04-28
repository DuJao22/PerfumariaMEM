import { Database } from '@sqlitecloud/drivers';
import bcrypt from 'bcrypt';
import DatabaseLocal from 'better-sqlite3';

const connectionString = process.env.SQLITE_CLOUD_CONNECTION_STRING;
let db: any;

if (connectionString) {
  console.log('Using SQLite Cloud database');
  db = new Database(connectionString);
} else {
  console.log('Using local SQLite database');
  const dbPath = process.env.DATABASE_PATH || 'ecommerce.db';
  const localDb = new DatabaseLocal(dbPath);
  
  // Wrapper simplificado para manter compatibilidade com interface async do SQLite Cloud
  db = {
    sql: async (query: string, ...params: any[]) => {
      const stmt = localDb.prepare(query);
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...params);
      } else {
        const info = stmt.run(...params);
        return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
      }
    },
    exec: async (query: string) => {
      localDb.exec(query);
    }
  };
}

export async function initDb() {
  try {
    console.log('Initializing database...');
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        login TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT DEFAULT 'cliente'
      );

      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        imagem TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT,
        personagem TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        cliente TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pendente',
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY(produto_id) REFERENCES produtos(id)
      );
    `);

    // Inserir backgrounds iniciais se não existirem
    const configs = [
      ['bg_padilha', '/padilha_bg.png'],
      ['bg_mulambo', '/mulambo_bg.png'],
      ['social_instagram', ''],
      ['social_tiktok', ''],
      ['social_bio', '']
    ];

    for (const [chave, valor] of configs) {
      await db.sql('INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)', chave, valor);
    }

    // Seed admin
    const admins = await db.sql('SELECT * FROM usuarios WHERE login = ?', 'leticiaadm') as any[];
    if (admins.length === 0) {
      const hashed = bcrypt.hashSync('30031936', 10);
      await db.sql('INSERT INTO usuarios (nome, login, senha, tipo) VALUES (?, ?, ?, ?)', 
        'Leticia Admin', 'leticiaadm', hashed, 'admin');
      console.log('Admin seeded.');
    }

    // Seed products if empty
    const productCountResult = await db.sql('SELECT COUNT(*) as count FROM produtos') as any[];
    const productCount = productCountResult[0]?.count || 0;

    if (productCount < 20) {
      const products = [
        ['Sedução Escarlate', 189.90, 'https://picsum.photos/seed/padilha1/400/600', 'Um perfume intenso com notas de rosas vermelhas e pimenta.', 'Eau de Parfum', 'padilha'],
        ['Mistério da Noite', 210.00, 'https://picsum.photos/seed/padilha2/400/600', 'Fragrância marcante com toques de couro e baunilha negra.', 'Intense', 'padilha'],
        ['Chama Ardente', 175.50, 'https://picsum.photos/seed/padilha3/400/600', 'Notas vibrantes de canela e âmbar.', 'Luminous', 'padilha'],
        ['Rainha das Almas', 250.00, 'https://picsum.photos/seed/padilha4/400/600', 'O topo da sofisticação e poder feminino.', 'Premium', 'padilha'],
        ['Dama da Noite', 198.00, 'https://picsum.photos/seed/padilha5/400/600', 'Floral intenso com notas de jasmim e mistério.', 'Eau de Parfum', 'padilha'],
        ['Poder Escarlate', 215.00, 'https://picsum.photos/seed/padilha6/400/600', 'Uma explosão de especiarias e sedução.', 'Intense', 'padilha'],
        ['Pérola Negra', 245.00, 'https://picsum.photos/seed/padilha7/400/600', 'Sofisticado e envolvente como uma noite estrelada.', 'Exclusivo', 'padilha'],
        ['Carmesim Real', 280.00, 'https://picsum.photos/seed/padilha8/400/600', 'A nobreza em gotas de sangue e ouro.', 'Limited Edition', 'padilha'],
        ['Feitiço Rubro', 185.00, 'https://picsum.photos/seed/padilha9/400/600', 'Um aroma que hipnotiza e domina os sentidos.', 'Mystique', 'padilha'],
        ['Toque de Fogo', 199.90, 'https://picsum.photos/seed/padilha10/400/600', 'O calor do asfalto e a paixão das encruzilhadas.', 'Urban', 'padilha'],
        ['Véu Místico', 195.00, 'https://picsum.photos/seed/mulambo1/400/600', 'Fragrância etérea com notas de lavanda mística e incenso.', 'Eau de Parfum', 'mulambo'],
        ['Segredo Roxo', 180.00, 'https://picsum.photos/seed/mulambo2/400/600', 'Toques de ametista e orquídea selvagem.', 'Floral', 'mulambo'],
        ['Essência da Estrada', 165.00, 'https://picsum.photos/seed/mulambo3/400/600', 'Notas terrosas combinadas com patchouli.', 'Ancestral', 'mulambo'],
        ['Magia Oculta', 230.00, 'https://picsum.photos/seed/mulambo4/400/600', 'Um aroma complexo que revela novos segredos a cada hora.', 'Exclusivo', 'mulambo'],
        ['Raízes Sagradas', 185.00, 'https://picsum.photos/seed/mulambo5/400/600', 'A força da natureza em um frasco purpúreo.', 'Natural', 'mulambo'],
        ['Encanto Cigano', 192.00, 'https://picsum.photos/seed/mulambo6/400/600', 'Liberdade e frescor com toques frutados.', 'Eau de Toilette', 'mulambo'],
        ['Luar De Prata', 210.00, 'https://picsum.photos/seed/mulambo7/400/600', 'Brilho e serenidade para os rituais modernos.', 'Luminous', 'mulambo'],
        ['Espírito Livre', 178.00, 'https://picsum.photos/seed/mulambo8/400/600', 'Caminhadas sob o sol e campos de ametista.', 'Fresh', 'mulambo'],
        ['Oráculo Purpúreo', 240.00, 'https://picsum.photos/seed/mulambo9/400/600', 'A sabedoria ancestral destilada em aromas profundos.', 'Premium', 'mulambo'],
        ['Sussurro das Matas', 160.00, 'https://picsum.photos/seed/mulambo10/400/600', 'Eco de vozes antigas em um jardim de orquídeas.', 'Organic', 'mulambo'],
      ];

      for (const p of products) {
        const exists = await db.sql('SELECT id FROM produtos WHERE nome = ?', p[0]) as any[];
        if (exists.length === 0) {
          await db.sql('INSERT INTO produtos (nome, preco, imagem, descricao, categoria, personagem) VALUES (?, ?, ?, ?, ?, ?)', ...p);
        }
      }
      console.log('Products seeded.');
    }

    // Seed initial paid orders for dashboard visibility if zero
    const orderCountRes = await db.sql('SELECT COUNT(*) as count FROM pedidos') as any[];
    if (orderCountRes[0]?.count === 0) {
      const productsRes = await db.sql('SELECT id, preco, personagem FROM produtos LIMIT 5') as any[];
      if (productsRes.length > 0) {
        for (let i = 0; i < 8; i++) {
           const p = productsRes[i % productsRes.length];
           const date = new Date();
           date.setDate(date.getDate() - (7 - i)); // Past 7 days
           const info = await db.sql('INSERT INTO pedidos (usuario_id, cliente, total, status, data) VALUES (?, ?, ?, ?, ?)', 
              null, `Venda Simulada ${i+1}`, p.preco, 'pago', date.toISOString());
           await db.sql('INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
              info.lastInsertRowid, p.id, 1, p.preco);
        }
      }
      console.log('Vendas simuladas seeded.');
    }
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Database initialization FAILED:', error);
    // Não mata o processo no dev, para podermos ver o erro no console se possível
  }
}

export default db;
