// Importando dependências
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do banco de dados SQLite
const dbPath = path.join(__dirname, 'bazar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
        process.exit(1); // Encerra o processo se não conseguir conectar ao banco
    }
    console.log('Banco de dados conectado!');
});

// Criar tabelas no banco de dados
const TABLES = {
    produtos: `CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL CHECK (preco >= 0),
        foto TEXT,
        status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    vendas: `CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL CHECK (quantidade > 0),
        total REAL NOT NULL CHECK (total >= 0),
        data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )`,
    indices: `
        CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);
        CREATE INDEX IF NOT EXISTS idx_produtos_criado_em ON produtos(criado_em);
        CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
        CREATE INDEX IF NOT EXISTS idx_vendas_produto ON vendas(produto_id);
    `
};

const initDB = async () => {
    for (const [table, query] of Object.entries(TABLES)) {
        // Split multiple statements for indices
        const queries = query.split(';').filter(q => q.trim());
        for (const singleQuery of queries) {
            if (!singleQuery.trim()) continue;
            
            await new Promise((resolve, reject) => {
                db.run(singleQuery.trim(), (err) => {
                    if (err) {
                        console.error(`Erro ao executar query: ${singleQuery}`);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        console.log(`Tabela/índices ${table} verificados/criados com sucesso.`);
    }
};

// Configuração do upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: async (req, file, cb) => {
        // Gera um hash único baseado no timestamp e um valor aleatório
        const hash = crypto.createHash('sha256')
            .update(`${Date.now()}-${Math.random()}`)
            .digest('hex')
            .substring(0, 16);
        
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${hash}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1 // Apenas um arquivo por vez
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
            return cb(new Error('Tipo de arquivo não suportado. Use apenas JPG, PNG ou GIF.'));
        }
        
        cb(null, true);
    }
});

// Middleware de tratamento de erros para upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ erro: 'Erro no upload do arquivo: ' + err.message });
    }
    next(err);
};

app.use(handleUploadError);

// Função auxiliar para validar produto
const validarProduto = (nome, preco, descricao) => {
    const erros = [];
    
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
        erros.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!preco || isNaN(preco) || preco < 0) {
        erros.push('Preço deve ser um número positivo');
    }
    
    if (descricao && typeof descricao !== 'string') {
        erros.push('Descrição deve ser um texto');
    }
    
    return erros;
};

// Função auxiliar para paginação
const getPaginationParams = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

// Prepared statements
let preparedStatements = {};

const initPreparedStatements = () => {
    preparedStatements = {
        insertProduto: db.prepare(`
            INSERT INTO produtos (nome, descricao, preco, foto, status) 
            VALUES (?, ?, ?, ?, ?)`),
        selectProdutos: db.prepare(`
            SELECT * FROM produtos 
            WHERE (:status IS NULL OR status = :status)
            ORDER BY criado_em DESC 
            LIMIT ? OFFSET ?`),
        selectProdutoById: db.prepare('SELECT * FROM produtos WHERE id = ?'),
        deleteProduto: db.prepare('DELETE FROM produtos WHERE id = ?'),
        insertVenda: db.prepare(`
            INSERT INTO vendas (produto_id, quantidade, total) 
            VALUES (?, ?, ?)`),
        selectVendas: db.prepare(`
            SELECT v.*, p.nome, p.foto 
            FROM vendas v
            JOIN produtos p ON v.produto_id = p.id 
            ORDER BY v.data_venda DESC
            LIMIT ? OFFSET ?`)
    };
};

// Rotas CRUD para produtos
app.post('/produtos', upload.single('foto'), async (req, res) => {
    try {
        const { nome, descricao, preco } = req.body;
        const erros = validarProduto(nome, preco, descricao);
        
        if (erros.length > 0) {
            if (req.file) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ erros });
        }

        const foto = req.file ? `/uploads/${req.file.filename}` : null;
        const result = await new Promise((resolve, reject) => {
            preparedStatements.insertProduto.run(
                [nome.trim(), descricao?.trim(), Number(preco), foto, 'ativo'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });
        
        res.status(201).json({ 
            id: result.lastID, 
            nome: nome.trim(), 
            descricao: descricao?.trim(), 
            preco: Number(preco), 
            foto,
            status: 'ativo',
            criado_em: new Date().toISOString()
        });
    } catch (err) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ erro: 'Erro ao criar produto: ' + err.message });
    }
});

app.get('/produtos', async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);
        const status = req.query.status;

        const rows = await new Promise((resolve, reject) => {
            preparedStatements.selectProdutos.all(
                [status || null, limit, offset],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json(rows); // Send just the rows array
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json([]); // Return empty array on error
    }
});

app.delete('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const produto = await new Promise((resolve, reject) => {
            preparedStatements.selectProdutoById.get([id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        await new Promise((resolve, reject) => {
            preparedStatements.deleteProduto.run([id], function(err) {
                if (err) reject(err);
                else if (this.changes === 0) {
                    reject(new Error('Produto não encontrado'));
                }
                else resolve();
            });
        });

        if (produto.foto) {
            const fotoPath = path.join(__dirname, produto.foto.replace('/uploads/', 'uploads/'));
            await fs.unlink(fotoPath).catch(console.error);
        }

        res.json({ message: 'Produto deletado com sucesso' });
    } catch (err) {
        if (err.message === 'Produto não encontrado') {
            res.status(404).json({ erro: err.message });
        } else {
            res.status(500).json({ erro: 'Erro ao deletar produto: ' + err.message });
        }
    }
});

// Rotas CRUD para vendas
app.post('/vendas', async (req, res) => {
    try {
        const { produto_id, quantidade, total } = req.body;
        
        if (!Number.isInteger(produto_id) || produto_id <= 0) {
            return res.status(400).json({ erro: 'ID do produto inválido' });
        }
        
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ erro: 'Quantidade deve ser um número inteiro positivo' });
        }
        
        if (!total || isNaN(total) || total < 0) {
            return res.status(400).json({ erro: 'Total deve ser um número positivo' });
        }

        const produto = await new Promise((resolve, reject) => {
            preparedStatements.selectProdutoById.get([produto_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!produto) {
            return res.status(404).json({ erro: 'Produto não encontrado' });
        }

        if (produto.status !== 'ativo') {
            return res.status(400).json({ erro: 'Produto inativo não pode ser vendido' });
        }

        const result = await new Promise((resolve, reject) => {
            preparedStatements.insertVenda.run(
                [produto_id, quantidade, total],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });
        
        res.status(201).json({ 
            id: result.lastID, 
            produto_id, 
            quantidade, 
            total,
            data_venda: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao registrar venda: ' + err.message });
    }
});

app.get('/vendas', async (req, res) => {
    try {
        const { page, limit, offset } = getPaginationParams(req);

        // Get total count for pagination
        const totalCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM vendas', [], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        const rows = await new Promise((resolve, reject) => {
            preparedStatements.selectVendas.all(
                [limit, offset],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        res.json({
            data: rows,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar vendas: ' + err.message });
    }
});

// Processo de limpeza ao encerrar
process.on('SIGINT', () => {
    // Finalize prepared statements
    Object.values(preparedStatements).forEach(stmt => stmt.finalize());
    
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err.message);
        } else {
            console.log('Conexão com banco de dados fechada.');
        }
        process.exit(err ? 1 : 0);
    });
});

// Initialize database and start server
(async () => {
    try {
        await initDB();
        initPreparedStatements();
        
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (err) {
        console.error('Erro fatal durante inicialização:', err);
        process.exit(1);
    }
})();
