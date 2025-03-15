// Importando dependências
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
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
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    vendas: `CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL CHECK (quantidade > 0),
        total REAL NOT NULL CHECK (total >= 0),
        data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )`
};

const initDB = async () => {
    try {
        for (const [table, query] of Object.entries(TABLES)) {
            await new Promise((resolve, reject) => {
                db.run(query, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            console.log(`Tabela ${table} verificada/criada com sucesso.`);
        }
    } catch (err) {
        console.error('Erro ao inicializar banco de dados:', err.message);
        process.exit(1);
    }
};
initDB();

// Configuração do upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        // Garante que o diretório existe
        require('fs').mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
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

// Rotas CRUD para produtos
app.post('/produtos', upload.single('foto'), async (req, res) => {
    try {
        const { nome, descricao, preco } = req.body;
        if (!nome || !preco || isNaN(preco) || preco < 0) {
            return res.status(400).json({ erro: 'Dados inválidos' });
        }

        const foto = req.file ? `/uploads/${req.file.filename}` : null;
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO produtos (nome, descricao, preco, foto) VALUES (?, ?, ?, ?)`,
                [nome, descricao, preco, foto],
                function(err) {
                    if (err) reject(err);
                    else resolve(this);
                }
            );
        });
        
        res.status(201).json({ 
            id: result.lastID, 
            nome, 
            descricao, 
            preco, 
            foto,
            criado_em: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao criar produto: ' + err.message });
    }
});

app.get('/produtos', async (req, res) => {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM produtos ORDER BY criado_em DESC`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar produtos: ' + err.message });
    }
});

app.delete('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM produtos WHERE id = ?`, id, function(err) {
                if (err) reject(err);
                else if (this.changes === 0) {
                    reject(new Error('Produto não encontrado'));
                }
                else resolve();
            });
        });
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
        if (!produto_id || !quantidade || !total || quantidade <= 0 || total < 0) {
            return res.status(400).json({ erro: 'Dados inválidos' });
        }

        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO vendas (produto_id, quantidade, total) VALUES (?, ?, ?)`,
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
        const rows = await new Promise((resolve, reject) => {
            db.all(
                `SELECT v.*, p.nome, p.foto 
                 FROM vendas v
                 JOIN produtos p ON v.produto_id = p.id 
                 ORDER BY v.data_venda DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar vendas: ' + err.message });
    }
});

// Processo de limpeza ao encerrar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err.message);
        } else {
            console.log('Conexão com banco de dados fechada.');
        }
        process.exit(err ? 1 : 0);
    });
});

// Inicializando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
