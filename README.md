# TudoBzr - Sistema de Gerenciamento de Bazar

## 📝 Descrição
Sistema desktop para gerenciamento de vendas de bazar, desenvolvido com Electron para criar uma aplicação desktop moderna e eficiente. O sistema permite o gerenciamento completo de produtos e vendas, com interface amigável e recursos de persistência de dados.

## 🚀 Tecnologias Utilizadas

### Frontend
- **Electron**: Framework para desenvolvimento de aplicações desktop
- **HTML/CSS/JavaScript**: Base do desenvolvimento frontend
- **Bootstrap 5**: Framework CSS para interface responsiva
- **Axios**: Cliente HTTP para comunicação com o backend

### Backend
- **Node.js**: Runtime JavaScript para o servidor
- **Express**: Framework web para Node.js
- **SQLite3**: Banco de dados SQL leve e eficiente
- **Multer**: Middleware para upload de arquivos
- **CORS**: Middleware para segurança de requisições cross-origin

## 💻 Funcionalidades Implementadas

### Produtos
- ✅ Cadastro de produtos com:
  - Nome
  - Preço
  - Descrição
  - Foto do produto
- ✅ Listagem de produtos com paginação
- ✅ Exclusão de produtos
- ✅ Visualização de detalhes do produto

### Vendas
- ✅ Registro de vendas com:
  - Produto vendido
  - Quantidade
  - Valor total
  - Data da venda
- ✅ Listagem de vendas com paginação

## 🔄 Fluxo de Dados
1. Interface desktop em Electron
2. Comunicação cliente-servidor via API REST
3. Persistência em banco SQLite
4. Upload de imagens com armazenamento local

## 🚧 Funcionalidades Pendentes

### Produtos
- [ ] Edição de produtos
- [ ] Filtros de busca
- [ ] Categorização de produtos
- [ ] Controle de estoque

### Vendas
- [ ] Comprovante de venda
- [ ] Relatórios de vendas
- [ ] Filtros por período
- [ ] Dashboard com métricas

### Sistema
- [ ] Autenticação de usuários
- [ ] Níveis de acesso
- [ ] Backup automático

## 📦 Como Executar

1. Clone o repositório
2. Instale as dependências do servidor:
```bash
cd server
npm install
```

3. Instale as dependências do cliente:
```bash
cd client
npm install
```

4. Inicie o servidor:
```bash
cd server
npm start
```

5. Em outro terminal, inicie o cliente:
```bash
cd client
npm start
```

## 🔧 Configuração do Ambiente
- Node.js versão 14 ou superior
- NPM ou Yarn para gerenciamento de pacotes
- Sistema operacional: Windows, Linux ou macOS

## 🤝 Contribuição
Contribuições são bem-vindas! Para contribuir:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença
Este projeto está sob a licença ISC.

## 🎯 Próximos Passos
1. Implementar sistema de autenticação
2. Adicionar funcionalidade de edição de produtos
3. Criar sistema de relatórios
4. Implementar backup automático
5. Melhorar a interface do usuário
6. Adicionar testes automatizados

## 📁 Estrutura do Projeto

tudobzr/
├── client/ # Aplicação desktop (Electron)
│ ├── node_modules/ # Dependências do cliente
│ ├── package.json # Configuração e dependências do cliente
│ └── src/ # Código fonte do cliente
│ ├── index.html # Página principal da aplicação
│ ├── main.js # Processo principal do Electron
│ ├── preload.js # Script de preload para segurança
│ └── renderer.js # Lógica da interface do usuário
│
└── server/ # Servidor backend
├── controllers/ # Controladores da aplicação
├── models/ # Modelos de dados
├── routes/ # Rotas da API
├── uploads/ # Pasta para armazenar imagens
├── node_modules/ # Dependências do servidor
├── package.json # Configuração e dependências do servidor
├── server.js # Arquivo principal do servidor
└── bazar.db # Banco de dados SQLite

Aqui está uma visão geral da estrutura de diretórios do projeto e onde cada coisa está localizada:

### 📂 Detalhamento dos Diretórios

#### Cliente (`/client`)
- **src/index.html**: Interface principal da aplicação
  - Contém a estrutura HTML da aplicação
  - Usa Bootstrap 5 para estilização
  - Define as tabs de produtos e vendas

- **src/main.js**: Configuração do Electron
  - Cria a janela principal
  - Configura as preferências de segurança
  - Gerencia o ciclo de vida da aplicação

- **src/preload.js**: Bridge de segurança
  - Define a API segura para comunicação com o servidor
  - Implementa tratamento de erros
  - Gerencia requisições HTTP via Axios

- **src/renderer.js**: Lógica da interface
  - Implementa as funções de manipulação da UI
  - Gerencia o estado da aplicação
  - Controla a exibição de produtos e vendas

#### Servidor (`/server`)
- **server.js**: Arquivo principal do servidor
  - Configuração do Express
  - Definição das rotas
  - Inicialização do banco de dados
  - Configuração do CORS e Multer

- **controllers/**: Lógica de negócios
  - Separação da lógica por funcionalidade
  - Tratamento das requisições
  - Validação de dados

- **models/**: Modelos de dados
  - Definição das estruturas de dados
  - Interação com o banco de dados
  - Validações de modelo

- **routes/**: Rotas da API
  - Definição dos endpoints
  - Mapeamento de URLs para controllers
  - Middleware de autenticação

- **uploads/**: Armazenamento de arquivos
  - Diretório para imagens dos produtos
  - Gerenciado pelo Multer
  - Acessível via URL estática

### 🔍 Arquivos Principais

#### Cliente
- `package.json`: Define scripts e dependências
  - Script de início com concurrently
  - Dependências como Electron e Axios
  - Configurações do projeto

#### Servidor
- `package.json`: Configuração do servidor
  - Scripts de desenvolvimento e produção
  - Dependências como Express e SQLite
  - Configurações do Node.js

- `bazar.db`: Banco de dados SQLite
  - Armazena produtos e vendas
  - Estrutura relacional
  - Persistência local

### 🛠️ Navegação e Desenvolvimento

1. Para trabalhar no frontend:
```bash
cd client/src
```
- Edite `index.html` para mudanças na interface
- Modifique `renderer.js` para lógica do cliente
- Ajuste `preload.js` para comunicação com servidor

2. Para trabalhar no backend:
```bash
cd server
```
- Edite `server.js` para configurações gerais
- Modifique arquivos em `controllers/` para lógica de negócios
- Ajuste `routes/` para endpoints da API

3. Para gerenciar dependências:
- No cliente: `cd client && npm install [pacote]`
- No servidor: `cd server && npm install [pacote]`

4. Para desenvolvimento:
- Inicie o servidor: `cd server && npm start`
- Em outro terminal: `cd client && npm start`