import { getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { consultasDocRef, planosDocRef } from './firebase-config.js';
import {
    DEFAULT_CONSULTAS,
    DEFAULT_PLANOS,
    STORAGE_KEYS,
    cloneItems,
    escapeAttribute,
    escapeHtml,
    getPrecoParts
} from './acia-data.js';

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    const modalForm = document.getElementById('modalForm');
    const modalFormMessage = document.getElementById('modalFormMessage');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');
    const ctaBtn = document.getElementById('ctaBtn');
    const planosGrid = document.getElementById('planosGrid');
    const modalPlanoSelect = document.getElementById('modalPlano');
    const consultasList = document.getElementById('consultasList');
    const consultasCount = document.getElementById('consultasCount');

    let planos = loadLocalPlanos();
    let consultas = loadLocalConsultas();

    renderPlanos();
    renderPlanoOptions();
    renderConsultas();
    setupScrollReveal();
    loadFirebasePlanos();
    loadFirebaseConsultas();

    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            openModal('');
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    async function loadFirebasePlanos() {
        try {
            const docSnapshot = await getDoc(planosDocRef);

            if (!docSnapshot.exists()) {
                return;
            }

            const firebasePlanos = docSnapshot.data().items;

            if (!Array.isArray(firebasePlanos) || !firebasePlanos.length) {
                return;
            }

            planos = firebasePlanos;
            saveLocalPlanos(planos);
            renderPlanos();
            renderPlanoOptions();
            setupScrollReveal();
        } catch (error) {
            console.error('Erro ao carregar planos atualizados:', error);
        }
    }

    async function loadFirebaseConsultas() {
        try {
            const docSnapshot = await getDoc(consultasDocRef);

            if (!docSnapshot.exists()) {
                return;
            }

            const firebaseConsultas = docSnapshot.data().items;

            if (!Array.isArray(firebaseConsultas) || !firebaseConsultas.length) {
                return;
            }

            consultas = firebaseConsultas;
            saveLocalConsultas(consultas);
            renderConsultas();
            setupScrollReveal();
        } catch (error) {
            console.error('Erro ao carregar consultas atualizadas:', error);
        }
    }

    function loadLocalPlanos() {
        const savedPlanos = localStorage.getItem(STORAGE_KEYS.planos);

        if (!savedPlanos) {
            return cloneItems(DEFAULT_PLANOS);
        }

        try {
            const parsedPlanos = JSON.parse(savedPlanos);
            return Array.isArray(parsedPlanos) && parsedPlanos.length ? parsedPlanos : cloneItems(DEFAULT_PLANOS);
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
            return cloneItems(DEFAULT_PLANOS);
        }
    }

    function saveLocalPlanos(planosToSave) {
        localStorage.setItem(STORAGE_KEYS.planos, JSON.stringify(planosToSave));
    }

    function loadLocalConsultas() {
        const savedConsultas = localStorage.getItem(STORAGE_KEYS.consultas);

        if (!savedConsultas) {
            return cloneItems(DEFAULT_CONSULTAS);
        }

        try {
            const parsedConsultas = JSON.parse(savedConsultas);
            return Array.isArray(parsedConsultas) && parsedConsultas.length ? parsedConsultas : cloneItems(DEFAULT_CONSULTAS);
        } catch (error) {
            console.error('Erro ao carregar consultas:', error);
            return cloneItems(DEFAULT_CONSULTAS);
        }
    }

    function saveLocalConsultas(consultasToSave) {
        localStorage.setItem(STORAGE_KEYS.consultas, JSON.stringify(consultasToSave));
    }

    function getPlanLabel(plano) {
        return `Plano ${plano.nome} - R$ ${plano.preco}`;
    }

    function renderPlanos() {
        if (!planosGrid) {
            return;
        }

        planosGrid.innerHTML = '';

        planos.forEach((plano, index) => {
            const card = document.createElement('div');
            const precoParts = getPrecoParts(plano.preco);
            const planoLabel = getPlanLabel(plano);

            card.className = `plano-card${plano.destaque ? ' plano-destaque' : ''}`;
            card.dataset.plano = planoLabel;
            card.style.setProperty('--item-index', index);
            card.innerHTML = `
                ${plano.destaque && plano.badge ? `<div class="plano-badge">${escapeHtml(plano.badge)}</div>` : ''}
                <div class="plano-header">
                    <h3 class="plano-nome">${escapeHtml(plano.nome)}</h3>
                    <div class="plano-preco">
                        <span class="plano-preco-valor">${escapeHtml(precoParts.reais)}</span>
                        <span class="plano-preco-valor-cent">${escapeHtml(precoParts.centavos)}</span>
                        <span class="plano-preco-periodo">/mês</span>
                    </div>
                </div>
                <p class="plano-indicacao">${escapeHtml(plano.indicacao)}</p>
                <button class="btn ${plano.destaque ? 'btn-primary' : 'btn-secondary'} btn-block plano-btn" type="button" data-plano="${escapeAttribute(planoLabel)}">Tenho interesse</button>
            `;

            card.querySelector('.plano-btn').addEventListener('click', function() {
                openModal(this.getAttribute('data-plano'));
            });

            planosGrid.appendChild(card);
        });
    }

    function renderConsultas() {
        if (!consultasList) {
            return;
        }

        consultasList.innerHTML = '';

        consultas.forEach((consulta, index) => {
            const item = document.createElement('li');
            item.className = 'consulta-item';
            item.style.setProperty('--item-index', index);
            item.textContent = consulta.nome;
            consultasList.appendChild(item);
        });

        if (consultasCount) {
            consultasCount.textContent = `${consultas.length} consultas disponíveis`;
        }
    }

    function setupScrollReveal() {
        const elements = document.querySelectorAll('.section-title, .section-subtitle, .beneficio-card, .consulta-item, .plano-card, .cta-content, .footer-content');

        if (!('IntersectionObserver' in window)) {
            elements.forEach(element => element.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.16 });

        elements.forEach(element => {
            element.classList.add('reveal-on-scroll');
            observer.observe(element);
        });
    }

    function renderPlanoOptions() {
        if (!modalPlanoSelect) {
            return;
        }

        modalPlanoSelect.innerHTML = '<option value="">Selecione um plano</option>';

        planos.forEach(plano => {
            const option = document.createElement('option');
            const label = getPlanLabel(plano);
            option.value = label;
            option.textContent = `${plano.nome} - R$ ${plano.preco}/mês`;
            modalPlanoSelect.appendChild(option);
        });
    }

    function openModal(planoSelecionado) {
        if (!modal) {
            return;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (planoSelecionado) {
            modalPlanoSelect.value = planoSelecionado;
        }

        setTimeout(() => {
            document.getElementById('modalNome').focus();
        }, 100);
    }

    function closeModal() {
        if (!modal) {
            return;
        }

        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetForm(modalForm);
        modalFormMessage.style.display = 'none';
    }

    function resetForm(form) {
        form.reset();
        clearValidationErrors(form);
    }

    function clearValidationErrors(form) {
        const inputs = form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validateForm(form) {
        let isValid = true;
        const nome = form.querySelector('[name="nome"]');
        const celular = form.querySelector('[name="celular"]');
        const email = form.querySelector('[name="email"]');
        const associado = form.querySelector('[name="associado"]');
        const plano = form.querySelector('[name="plano"]');

        clearValidationErrors(form);

        if (!nome.value.trim()) {
            nome.style.borderColor = '#c41e3a';
            isValid = false;
        }

        if (!celular.value.trim()) {
            celular.style.borderColor = '#c41e3a';
            isValid = false;
        }

        if (!email.value.trim()) {
            email.style.borderColor = '#c41e3a';
            isValid = false;
        } else if (!validateEmail(email.value.trim())) {
            email.style.borderColor = '#c41e3a';
            isValid = false;
        }

        if (!associado.value) {
            associado.style.borderColor = '#c41e3a';
            isValid = false;
        }

        if (!plano.value) {
            plano.style.borderColor = '#c41e3a';
            isValid = false;
        }

        return isValid;
    }

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'form-message ' + type;
        element.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    async function sendFormData(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.dataEnvio = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });

        try {
            const response = await fetch('/.netlify/functions/enviar-interesse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || result.details || 'Erro ao enviar');
            }

            return result;
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    }

    if (modalForm) {
        modalForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateForm(modalForm)) {
                return;
            }

            modalSubmitBtn.disabled = true;
            modalSubmitBtn.textContent = 'Enviando...';
            showMessage(modalFormMessage, 'Enviando sua solicitação...', 'loading');

            try {
                await sendFormData(modalForm);
                showMessage(modalFormMessage, 'Obrigado! Sua solicitação foi enviada com sucesso. A equipe da ACIA entrará em contato em breve.', 'success');

                setTimeout(() => {
                    closeModal();
                }, 2500);

                modalForm.reset();
            } catch (error) {
                showMessage(modalFormMessage, 'Desculpe, houve um erro ao enviar sua solicitação. Por favor, tente novamente ou entre em contato conosco pelo e-mail scpc.suporte@acia.com.br', 'error');
            } finally {
                modalSubmitBtn.disabled = false;
                modalSubmitBtn.textContent = 'Enviar interesse';
            }
        });
    }

    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
