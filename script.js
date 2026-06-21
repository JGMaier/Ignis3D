function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        autoDisplay: false
    }, 'google_translate_element');
}

// Função para obter o elemento select do Google Translate de forma segura
function getGoogleTranslateSelect() {
    return document.querySelector('.goog-te-combo');
}

// Função para disparar a tradução
function triggerGoogleTranslate(langCode) {
    const select = getGoogleTranslateSelect();
    if (select) { // Se o elemento select do Google Translate foi encontrado
        select.value = langCode; // Define o valor do select para o código do idioma
        
        // Dispara o evento de mudança de forma mais robusta e compatível com scripts legados
        if (document.createEvent) {
            var event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, true);
            select.dispatchEvent(event);
        } else {
            select.fireEvent('onchange');
        }
        return true; // Tradução disparada com sucesso
    }
    return false; // Elemento select não encontrado
}

function translateTo(langCode, element) {
    // Tenta disparar a tradução imediatamente
    if (triggerGoogleTranslate(langCode)) {
        // Fecha o menu de idiomas após a seleção
        document.querySelector('.lang-menu').classList.remove('show');

        // Atualiza o texto do botão para o idioma selecionado
        const btn = document.querySelector('.lang-btn');
        const langName = element.innerText; // Usa o innerText do elemento clicado
        btn.innerHTML = `🌐 ${langName.split(' ')[0]}`;
    } else { // Se o elemento do Google Translate ainda não estiver pronto, tenta novamente
        let retryCount = 0;
        const maxRetries = 10; // Tenta por até 1 segundo (10 * 100ms)
        const intervalId = setInterval(() => {
            if (triggerGoogleTranslate(langCode)) {
                clearInterval(intervalId); // Para de tentar se a tradução for disparada
                const btn = document.querySelector('.lang-btn');
                const langName = element.innerText;
                btn.innerHTML = `🌐 ${langName.split(' ')[0]}`;
                document.querySelector('.lang-menu').classList.remove('show');
            } else if (retryCount >= maxRetries) {
                clearInterval(intervalId); // Para de tentar se o número máximo de retentativas for atingido
                console.error("Elemento de seleção do Google Translate não encontrado após múltiplas retentativas.");
            }
            retryCount++;
        }, 100); // Verifica a cada 100ms
    }
}

// Lógica para alternar o dropdown de idioma ao clicar
document.addEventListener('DOMContentLoaded', () => {
    const langDropdown = document.querySelector('.lang-dropdown');
    const langBtn = document.querySelector('.lang-btn');
    const langMenu = document.querySelector('.lang-menu');

    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o listener do documento feche o menu imediatamente
            langMenu.classList.toggle('show');
        });

        // Fecha o dropdown se clicar em qualquer lugar fora do contêiner do dropdown
        document.addEventListener('click', (e) => {
            if (!langDropdown.contains(e.target)) {
                langMenu.classList.remove('show');
            }
        });
    }

    // ===== Contador de downloads (persistente no localStorage) =====
    const downloadLink = document.getElementById('main-download-link');
    const countSpan = document.getElementById('download-count');
    const storageKey = 'download_count_main';

    function formatCount(n) { return String(n).padStart(2, '0'); }

    let count = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (countSpan) countSpan.textContent = formatCount(isNaN(count) ? 0 : count);

    if (downloadLink) {
        const increment = () => {
            count = (isNaN(count) ? 0 : count) + 1;
            localStorage.setItem(storageKey, String(count));
            if (countSpan) countSpan.textContent = formatCount(count);
        };

        // Usa eventos que disparam antes da navegação para garantir que o incremento seja salvo
        downloadLink.addEventListener('mousedown', increment);
        downloadLink.addEventListener('touchstart', increment, { passive: true });
        // Também lida com ativação via teclado
        downloadLink.addEventListener('keydown', (e) => { if (e.key === 'Enter') increment(); });
    }

    // Botão de reset - visível apenas quando admin=1 ou via parâmetro reset_count=1
    const resetBtn = document.getElementById('download-reset');
    const params = new URLSearchParams(window.location.search);

    function showReset() {
        if (resetBtn) {
            resetBtn.classList.add('show');
            resetBtn.setAttribute('aria-hidden', 'false');
        }
    }

    function doReset() {
        count = 0;
        localStorage.setItem(storageKey, String(count));
        if (countSpan) countSpan.textContent = formatCount(count);
    }

    // Se o parâmetro reset_count=1 estiver presente, reseta imediatamente
    if (params.get('reset_count') === '1') {
        doReset();
        showReset();
    }

    // Se admin=1 estiver presente, apenas mostra o botão de reset (sem reset automático)
    if (params.get('admin') === '1') {
        showReset();
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const ok = confirm('Resetar contador de downloads para 0?');
            if (ok) doReset();
        });
    }
});
