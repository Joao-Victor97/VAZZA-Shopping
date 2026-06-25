let todosProdutos = [];
let produtoAtualModal = null;
let imagemAtualNoModal = 0;
let cardCounter = 0;

function getImagensDoProduto(produto) {
    const keys = [
        'imagem',
        'imagem_secundaria',
        'imagem_terciaria',
        'imagem_quaternaria'
    ];
    return keys.reduce((arr, key) => {
        if (produto[key]) arr.push(produto[key]);
        return arr;
    }, []);
}

function abrirModal(index, numImg = 0) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    
    produtoAtualModal = index;
    imagemAtualNoModal = numImg;
    
    const produto = todosProdutos[index];
    const imagens = getImagensDoProduto(produto);
    const imagem = imagens[numImg] || imagens[0];
    
    modalImg.src = imagem;
    modal.style.display = "flex";
}

function nextImageModal(event) {
    event.stopPropagation();
    if (produtoAtualModal === null) return;
    
    const produto = todosProdutos[produtoAtualModal];
    const imagens = getImagensDoProduto(produto);
    if (imagens.length < 2) return;
    
    imagemAtualNoModal = (imagemAtualNoModal + 1) % imagens.length;
    document.getElementById("modalImage").src = imagens[imagemAtualNoModal];
}

function prevImageModal(event) {
    event.stopPropagation();
    if (produtoAtualModal === null) return;
    
    const produto = todosProdutos[produtoAtualModal];
    const imagens = getImagensDoProduto(produto);
    if (imagens.length < 2) return;
    
    imagemAtualNoModal = (imagemAtualNoModal - 1 + imagens.length) % imagens.length;
    document.getElementById("modalImage").src = imagens[imagemAtualNoModal];
}

function fecharModal(event) {
    const modal = document.getElementById("imageModal");
    // Fecha apenas se clicou no fundo (modal), não em elementos dentro dele
    if (event && event.target.id !== "imageModal") return;
    modal.style.display = "none";
    produtoAtualModal = null;
    imagemAtualNoModal = 0;
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        fecharModal();
    } else if (event.key === "ArrowRight") {
        nextImageModal({stopPropagation: () => {}});
    } else if (event.key === "ArrowLeft") {
        prevImageModal({stopPropagation: () => {}});
    }
});

async function carregarProdutos() {

    const resposta =
        await fetch("produtos.json");

    const produtos =
        await resposta.json();

    todosProdutos = produtos;

    renderizarProdutos(produtos, 4);
}

function renderizarProdutos(produtos, limite = null) {
    if (limite !== null) {
        produtos = produtos.slice(0, limite);
    }

    const container =
        document.getElementById("products");

    container.innerHTML = "";

    if (produtos.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                Nenhum produto encontrado. Tente outro termo ou clique em Home para ver a lista completa.
            </div>
        `;
        return;
    }

    produtos.forEach((produto, index) => {

        // Encontra o índice original do produto em todosProdutos
        const indiceProdutoOriginal = todosProdutos.findIndex(p => p.nome === produto.nome && p.categoria === produto.categoria);
        // Gera um UID único para este card renderizado (evita colisões entre cards)
        cardCounter += 1;
        const cardUid = `${indiceProdutoOriginal}-${cardCounter}`;

        function getDescricaoCurta(texto) {
            const textoSemQuebra = texto.replace(/<br>/g, ' ');
            if (textoSemQuebra.length <= 120) {
                return texto;
            }
            return textoSemQuebra.slice(0, 120).trim() + '...';
        }

        const descricaoCurta = getDescricaoCurta(produto.descricao);
        const mostraLerMais = produto.descricao !== descricaoCurta;

        let galeria = '';

        const imagens = getImagensDoProduto(produto);

        if (imagens.length > 1) {
            const imagensHtml = imagens.map((src, imgIndex) => `
                <img src="${src}" alt="${produto.nome} - ${imgIndex + 1}" class="gallery-img${imgIndex === 0 ? '' : ' hidden'}" id="img-${cardUid}-${imgIndex}" style="cursor: pointer;" onclick="abrirModal(${indiceProdutoOriginal}, ${imgIndex})">
            `).join('');

            const dotsHtml = imagens.map((_, imgIndex) => `
                <span class="dot${imgIndex === 0 ? ' active' : ''}" data-card-uid="${cardUid}" data-image-index="${imgIndex}" onclick="mudarImage('${cardUid}', ${imgIndex})"></span>
            `).join('');

            galeria = `
                <div class="card-gallery" data-card-uid="${cardUid}">
                    ${imagensHtml}
                    <button class="gallery-btn prev" onclick="prevImage('${cardUid}')">❮</button>
                    <button class="gallery-btn next" onclick="nextImage('${cardUid}')">❯</button>
                    <div class="gallery-dots" data-card-uid="${cardUid}">
                        ${dotsHtml}
                    </div>
                </div>
            `;
        } else {
            galeria = `<img src="${imagens[0]}" alt="${produto.nome}" style="width: 100%; height: 250px; object-fit: cover; cursor: pointer;" onclick="abrirModal(${indiceProdutoOriginal}, 0)">`;
        }

        container.innerHTML += `
        <div class="card">

            ${galeria}

            <div class="card-content">

                <h3>${produto.nome}</h3>

                <p class="descricao-produto" id="desc-${cardUid}">${descricaoCurta}</p>
                ${mostraLerMais ? `<button class="read-more-btn" id="readmore-${cardUid}" onclick="toggleDescricao('${cardUid}')">Ler mais</button>` : ''}

                <a
                class="btn"
                href="${produto.link}"
                target="_blank">

                Ver na Amazon

                </a>

            </div>

        </div>
        `;

    });

}

let imagemAtual = {};

function nextImage(cardUid) {
    const cardId = String(cardUid);
    const productIndex = Number(cardId.split('-')[0]);
    const imagens = getImagensDoProduto(todosProdutos[productIndex]);
    imagemAtual[cardId] = ((imagemAtual[cardId] || 0) + 1) % imagens.length;
    mudarImage(cardId, imagemAtual[cardId]);
}

function prevImage(cardUid) {
    const cardId = String(cardUid);
    const productIndex = Number(cardId.split('-')[0]);
    const imagens = getImagensDoProduto(todosProdutos[productIndex]);
    imagemAtual[cardId] = ((imagemAtual[cardId] || 0) - 1 + imagens.length) % imagens.length;
    mudarImage(cardId, imagemAtual[cardId]);
}

function mudarImage(cardUid, num) {
    const cardId = String(cardUid);
    const productIndex = Number(cardId.split('-')[0]);
    const imagens = getImagensDoProduto(todosProdutos[productIndex]);
    imagens.forEach((_, imgIndex) => {
        const imgEl = document.getElementById(`img-${cardId}-${imgIndex}`);
        if (imgEl) {
            if (imgIndex === num) {
                imgEl.classList.remove('hidden');
            } else {
                imgEl.classList.add('hidden');
            }
        }
    });

    const cardDots = document.querySelector(`.gallery-dots[data-card-uid="${cardId}"]`);
    if (cardDots) {
        cardDots.querySelectorAll('.dot').forEach((dot, i) => {
            if (i === num) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    imagemAtual[cardId] = num;
}

function toggleDescricao(cardUid) {
    const cardId = String(cardUid);
    const descricaoEl = document.getElementById(`desc-${cardId}`);
    const botao = document.getElementById(`readmore-${cardId}`);
    const productIndex = Number(cardId.split('-')[0]);
    const produto = todosProdutos[productIndex];

    if (!descricaoEl || !botao || !produto) return;

    const textoCurto = produto.descricao.replace(/<br>/g, ' ').slice(0, 120).trim() + '...';

    if (botao.textContent === 'Ler mais') {
        // Expande: coloca o conteúdo completo e aplica a classe para transição
        descricaoEl.innerHTML = produto.descricao;
        // força reflow antes de adicionar a classe (ajuda a garantir transição)
        // eslint-disable-next-line no-unused-expressions
        descricaoEl.offsetHeight;
        descricaoEl.classList.add('expanded');
        botao.textContent = 'Ler menos';
    } else {
        // Recolhe: remove a classe para permitir a transição de recolhimento
        descricaoEl.classList.remove('expanded');
        // Após a animação, reduz o texto para a versão curta para evitar mostrar todo o conteúdo
        setTimeout(() => {
            descricaoEl.textContent = textoCurto;
        }, 360);
        botao.textContent = 'Ler mais';
    }
}

function searchProducts() {

    const termo =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase();

    const filtrados =
        todosProdutos.filter(produto =>

            produto.nome
                .toLowerCase()
                .includes(termo)

        );

    renderizarProdutos(filtrados);
}

function filtrarPorCategoria(categoria) {
    document.getElementById("searchInput").value = "";
    const filtrados = todosProdutos.filter(produto => produto.categoria === categoria);
    renderizarProdutos(filtrados);
    const titleEl = document.querySelector('.section-title');
    if (titleEl) titleEl.textContent = `Categoria: ${categoria}`;
    // Marca a categoria clicada como ativa e desmarca as outras
    document.querySelectorAll('.category').forEach(el => {
        if (el.dataset && el.dataset.category === categoria) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarTodosProdutos() {
    document.getElementById("searchInput").value = "";
    renderizarProdutos(todosProdutos, 4);
    const titleEl = document.querySelector('.section-title');
    if (titleEl) titleEl.textContent = 'Produtos em Destaque';
    // Remove marcação ativa das categorias
    document.querySelectorAll('.category').forEach(el => el.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: "smooth" });
}

carregarProdutos();