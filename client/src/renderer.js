// Current page state
let currentProdutosPage = 1;
let currentVendasPage = 1;

// Função para mostrar mensagens de erro
function mostrarErro(mensagem, tipo = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo === 'error' ? 'danger' : 'warning'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Inserir no topo do container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Verificar conexão com o servidor
async function verificarServidor() {
    try {
        await window.api.produtos.listar(1, 1);
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            mostrarErro('Não foi possível conectar ao servidor. Verifique se o servidor está rodando em http://localhost:3000', 'warning');
        } else {
            mostrarErro(`Erro ao conectar com o servidor: ${error.message}`);
        }
        return false;
    }
}

// Carregar produtos
async function carregarProdutos(page = 1) {
    try {
        const produtos = await window.api.produtos.listar(page);
        const listaProdutos = document.getElementById('listaProdutos');
        listaProdutos.innerHTML = '';

        if (!Array.isArray(produtos)) {
            throw new Error('Resposta inválida do servidor');
        }

        if (produtos.length === 0) {
            listaProdutos.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Nenhum produto cadastrado</p>
                </div>
            `;
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'col-md-4 produto-card';
            card.innerHTML = `
                <div class="card">
                    ${produto.foto ? 
                        `<img src="http://localhost:3001${produto.foto}" class="card-img-top" alt="${produto.nome}">` 
                        : '<div class="card-img-top bg-light text-center py-5">Sem imagem</div>'}
                    <div class="card-body">
                        <h5 class="card-title">${produto.nome}</h5>
                        <p class="card-text">R$ ${produto.preco.toFixed(2)}</p>
                        <p class="card-text">${produto.descricao || ''}</p>
                        <button class="btn btn-danger btn-sm" onclick="deletarProduto(${produto.id})">
                            Excluir
                        </button>
                    </div>
                </div>
            `;
            listaProdutos.appendChild(card);
        });

        // Atualizar paginação
        const paginacao = document.getElementById('produtosPaginacao');
        paginacao.innerHTML = criarPaginacao(response.pagination, 'mudarPaginaProdutos');
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        if (!await verificarServidor()) return;
        mostrarErro('Erro ao carregar produtos. Tente novamente.');
    }
}

// Carregar vendas
async function carregarVendas(page = 1) {
    try {
        const response = await window.api.vendas.listar(page);
        const listaVendas = document.getElementById('listaVendas');
        listaVendas.innerHTML = '';

        if (response.data.length === 0) {
            listaVendas.innerHTML = `
                <div class="text-center">
                    <p class="text-muted">Nenhuma venda registrada</p>
                </div>
            `;
            return;
        }

        response.data.forEach(venda => {
            const item = document.createElement('div');
            item.className = 'card mb-3';
            item.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Venda #${venda.id}</h5>
                    <p class="card-text">
                        Produto: ${venda.nome}<br>
                        Quantidade: ${venda.quantidade}<br>
                        Total: R$ ${venda.total.toFixed(2)}<br>
                        Data: ${new Date(venda.data_venda).toLocaleString()}
                    </p>
                </div>
            `;
            listaVendas.appendChild(item);
        });

        // Atualizar paginação
        const paginacao = document.getElementById('vendasPaginacao');
        paginacao.innerHTML = criarPaginacao(response.pagination, 'mudarPaginaVendas');
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        if (!await verificarServidor()) return;
        mostrarErro('Erro ao carregar vendas. Tente novamente.');
    }
}

// Criar HTML da paginação
function criarPaginacao(paginationData, onClickFunction) {
    const { total, page, limit, pages } = paginationData;
    
    let html = '<nav><ul class="pagination">';
    
    // Botão Previous
    html += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${onClickFunction}(${page - 1})">Anterior</a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= pages; i++) {
        html += `
            <li class="page-item ${page === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="${onClickFunction}(${i})">${i}</a>
            </li>
        `;
    }

    // Botão Next
    html += `
        <li class="page-item ${page === pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${onClickFunction}(${page + 1})">Próximo</a>
        </li>
    `;

    html += '</ul></nav>';
    return html;
}

// Funções de mudança de página
function mudarPaginaProdutos(page) {
    currentProdutosPage = page;
    carregarProdutos(page);
}

function mudarPaginaVendas(page) {
    currentVendasPage = page;
    carregarVendas(page);
}

// Deletar produto
async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            await window.api.produtos.deletar(id);
            carregarProdutos(currentProdutosPage);
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            alert('Erro ao deletar produto');
        }
    }
}

// Salvar novo produto
document.getElementById('btnSalvarProduto').addEventListener('click', async () => {
    const form = document.getElementById('formNovoProduto');
    const formData = new FormData(form);

    try {
        await window.api.produtos.criar(formData);
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('novoProdutoModal')).hide();
        carregarProdutos(currentProdutosPage);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        alert('Erro ao criar produto');
    }
});

// Carregar dados iniciais
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar conexão com servidor primeiro
    if (await verificarServidor()) {
        carregarProdutos();
        carregarVendas();
    }
});

// Atualizar dados ao mudar de tab
document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
        if (e.target.id === 'produtos-tab') {
            carregarProdutos(currentProdutosPage);
        } else if (e.target.id === 'vendas-tab') {
            carregarVendas(currentVendasPage);
        }
    });
}); 