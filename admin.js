import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
    getDoc,
    serverTimestamp,
    setDoc
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { consultasDocRef, firebaseAuth, planosDocRef } from './firebase-config.js';
import {
    DEFAULT_CONSULTAS,
    DEFAULT_PLANOS,
    STORAGE_KEYS,
    cloneItems,
    escapeAttribute,
    escapeHtml,
    normalizePreco
} from './acia-data.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('loginSection');
    const adminPanelSection = document.getElementById('adminPanelSection');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPlanList = document.getElementById('adminPlanList');
    const adminConsultaList = document.getElementById('adminConsultaList');
    const adminAddPlan = document.getElementById('adminAddPlan');
    const adminAddConsulta = document.getElementById('adminAddConsulta');
    const adminTabButtons = document.querySelectorAll('[data-admin-tab]');
    const adminTabPanels = document.querySelectorAll('[data-admin-panel]');
    const adminSavePlans = document.getElementById('adminSavePlans');
    const adminResetPlans = document.getElementById('adminResetPlans');
    const adminMessage = document.getElementById('adminMessage');
    const adminDialog = document.getElementById('adminDialog');
    const adminDialogTitle = document.getElementById('adminDialogTitle');
    const adminDialogText = document.getElementById('adminDialogText');
    const adminDialogCancel = document.getElementById('adminDialogCancel');
    const adminDialogConfirm = document.getElementById('adminDialogConfirm');
    const adminFloatingSave = document.getElementById('adminFloatingSave');

    let planos = loadLocal(STORAGE_KEYS.planos, DEFAULT_PLANOS);
    let consultas = loadLocal(STORAGE_KEYS.consultas, DEFAULT_CONSULTAS);
    let savedSnapshot = makeSnapshot(planos, consultas);
    let hasLoadedAdminData = false;

    setupScrollReveal();
    setupTabs();

    onAuthStateChanged(firebaseAuth, function(user) {
        const isLoggedIn = Boolean(user);

        loginSection.hidden = isLoggedIn;
        adminPanelSection.hidden = !isLoggedIn;
        logoutBtn.hidden = !isLoggedIn;

        if (isLoggedIn && !hasLoadedAdminData) {
            hasLoadedAdminData = true;
            showMessage(adminMessage, 'Tudo certo. Carregando dados...', 'loading');
            loadFirebaseData();
        } else {
            updateFloatingSaveButton();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = loginForm.querySelector('[name="email"]').value.trim();
            const password = loginForm.querySelector('[name="password"]').value;

            loginSubmitBtn.disabled = true;
            loginSubmitBtn.textContent = 'Entrando...';
            showMessage(loginMessage, 'Validando acesso...', 'loading');

            try {
                await signInWithEmailAndPassword(firebaseAuth, email, password);
                loginForm.reset();
                showMessage(loginMessage, 'Acesso liberado.', 'success');
            } catch (error) {
                console.error('Erro de login:', error);
                showMessage(loginMessage, getLoginErrorMessage(error), 'error');
            } finally {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.textContent = 'Entrar';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            const confirmed = await confirmDialog({
                title: 'Sair do painel?',
                text: 'Você precisará informar e-mail e senha novamente para editar os dados.',
                confirmText: 'Sair'
            });

            if (!confirmed) {
                return;
            }

            await signOut(firebaseAuth);
            hasLoadedAdminData = false;
            adminPlanList.innerHTML = '';
            adminConsultaList.innerHTML = '';
            updateFloatingSaveButton();
        });
    }

    adminAddPlan.addEventListener('click', function() {
        const data = readAdminData();
        planos = data.planos;
        consultas = data.consultas.map(consulta => ({
            ...consulta,
            precos: [...consulta.precos, '0,00']
        }));

        planos.push({
            id: createId('plano'),
            nome: 'Novo plano',
            preco: '0,00',
            indicacao: 'Descreva a indicação do plano',
            destaque: false,
            badge: ''
        });

        renderAdmin();
        setActiveTab('planos');
        showMessage(adminMessage, 'Novo plano adicionado. Revise os valores da tabela e salve.', 'loading');
    });

    adminAddConsulta.addEventListener('click', function() {
        const data = readAdminData();
        planos = data.planos;
        consultas = data.consultas;
        consultas.push({
            id: createId('consulta'),
            nome: 'Nova consulta',
            precos: planos.map(() => '0,00')
        });

        renderAdmin();
        setActiveTab('consultas');
        showMessage(adminMessage, 'Nova consulta adicionada. Informe os valores e salve.', 'loading');
    });

    adminSavePlans.addEventListener('click', savePendingChanges);
    adminFloatingSave.addEventListener('click', savePendingChanges);

    adminResetPlans.addEventListener('click', async function() {
        const confirmed = await confirmDialog({
            title: 'Restaurar padrão?',
            text: 'Essa ação substitui planos e tabela de consultas pelos dados originais.',
            confirmText: 'Restaurar'
        });

        if (!confirmed) {
            return;
        }

        planos = cloneItems(DEFAULT_PLANOS);
        consultas = cloneItems(DEFAULT_CONSULTAS);
        renderAdmin();
        showMessage(adminMessage, 'Restaurando dados...', 'loading');

        try {
            await saveData(planos, consultas);
            savedSnapshot = makeSnapshot(planos, consultas);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Dados restaurados com sucesso.', 'success');
            showAlert({ title: 'Dados restaurados', text: 'Os planos e consultas padrão já estão disponíveis.' });
        } catch (error) {
            console.error('Erro ao restaurar:', error);
            showMessage(adminMessage, 'Não foi possível publicar a restauração.', 'error');
        }
    });

    adminPlanList.addEventListener('click', function(e) {
        const removeButton = e.target.closest('[data-remove-plan]');

        if (!removeButton) {
            return;
        }

        const planItem = removeButton.closest('.admin-plan-item');
        const planName = planItem.querySelector('[name="nome"]').value.trim() || 'este plano';

        confirmDialog({
            title: 'Remover plano?',
            text: `Você está removendo "${planName}". A tabela perderá a coluna desse plano depois de salvar.`,
            confirmText: 'Remover'
        }).then(confirmed => {
            if (!confirmed) {
                return;
            }

            const index = Array.from(adminPlanList.querySelectorAll('.admin-plan-item')).indexOf(planItem);
            planItem.remove();
            adminConsultaList.querySelectorAll('.admin-consulta-prices').forEach(grid => {
                const input = grid.querySelector(`[data-price-index="${index}"]`);
                if (input) {
                    input.closest('.form-group').remove();
                }
            });
            refreshPriceIndexes();
            updateFloatingSaveButton();
        });
    });

    adminConsultaList.addEventListener('click', function(e) {
        const removeButton = e.target.closest('[data-remove-consulta]');

        if (!removeButton) {
            return;
        }

        const item = removeButton.closest('.admin-consulta-item');
        const consultaName = item.querySelector('[name="consultaNome"]').value.trim() || 'esta consulta';

        confirmDialog({
            title: 'Remover consulta?',
            text: `Você está removendo "${consultaName}". A remoção só será aplicada depois de salvar.`,
            confirmText: 'Remover'
        }).then(confirmed => {
            if (!confirmed) {
                return;
            }

            item.remove();
            updateFloatingSaveButton();
        });
    });

    [adminPlanList, adminConsultaList].forEach(list => {
        list.addEventListener('input', updateFloatingSaveButton);
        list.addEventListener('change', updateFloatingSaveButton);
    });

    function setupTabs() {
        adminTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                setActiveTab(this.dataset.adminTab);
            });
        });
    }

    function setActiveTab(tabName) {
        adminTabButtons.forEach(button => {
            const isActive = button.dataset.adminTab === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        adminTabPanels.forEach(panel => {
            const isActive = panel.dataset.adminPanel === tabName;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });

        setupScrollReveal();
    }

    async function loadFirebaseData() {
        renderAdmin();

        try {
            const [planosSnapshot, consultasSnapshot] = await Promise.all([
                getDoc(planosDocRef),
                getDoc(consultasDocRef)
            ]);

            if (planosSnapshot.exists()) {
                const firebasePlanos = planosSnapshot.data().items;
                if (Array.isArray(firebasePlanos) && firebasePlanos.length) {
                    planos = firebasePlanos;
                    saveLocal(STORAGE_KEYS.planos, planos);
                }
            }

            if (consultasSnapshot.exists()) {
                const firebaseConsultas = consultasSnapshot.data().items;
                if (Array.isArray(firebaseConsultas) && firebaseConsultas.length) {
                    consultas = firebaseConsultas;
                    saveLocal(STORAGE_KEYS.consultas, consultas);
                }
            }

            consultas = normalizeConsultasForPlanos(consultas, planos);
            savedSnapshot = makeSnapshot(planos, consultas);
            renderAdmin();
            adminMessage.style.display = 'none';
        } catch (error) {
            console.error('Erro ao carregar dados atualizados:', error);
            consultas = normalizeConsultasForPlanos(consultas, planos);
            savedSnapshot = makeSnapshot(planos, consultas);
            renderAdmin();
            showMessage(adminMessage, 'Não foi possível carregar os dados atualizados. Exibindo uma cópia salva neste navegador.', 'error');
        }
    }

    function renderAdmin() {
        renderAdminPlanos();
        renderAdminConsultas();
        setupScrollReveal();
        updateFloatingSaveButton();
    }

    function renderAdminPlanos() {
        adminPlanList.innerHTML = '';

        planos.forEach((plano, index) => {
            const item = document.createElement('div');
            item.className = 'admin-plan-item';
            item.dataset.id = plano.id || createId('plano');
            item.style.setProperty('--item-index', index);
            item.innerHTML = `
                <div class="admin-plan-head">
                    <strong>${escapeHtml(plano.nome)}</strong>
                    <button class="admin-remove-btn" type="button" data-remove-plan>Remover</button>
                </div>
                <div class="admin-grid">
                    <label class="form-group">
                        <span class="form-label">Nome do plano</span>
                        <input class="form-input" type="text" name="nome" value="${escapeAttribute(plano.nome)}" required>
                    </label>
                    <label class="form-group">
                        <span class="form-label">Valor mensal</span>
                        <input class="form-input" type="text" name="preco" value="${escapeAttribute(plano.preco)}" placeholder="69,90" required>
                    </label>
                    <label class="form-group admin-grid-wide">
                        <span class="form-label">Indicação</span>
                        <input class="form-input" type="text" name="indicacao" value="${escapeAttribute(plano.indicacao)}" required>
                    </label>
                    <label class="form-group">
                        <span class="form-label">Texto do destaque</span>
                        <input class="form-input" type="text" name="badge" value="${escapeAttribute(plano.badge || '')}" placeholder="Mais vendido">
                    </label>
                    <label class="admin-check">
                        <input type="checkbox" name="destaque" ${plano.destaque ? 'checked' : ''}>
                        <span>Destacar este plano</span>
                    </label>
                </div>
            `;
            adminPlanList.appendChild(item);
        });
    }

    function renderAdminConsultas() {
        adminConsultaList.innerHTML = '';
        const currentPlanos = readAdminPlanos();
        consultas = normalizeConsultasForPlanos(consultas, currentPlanos);

        consultas.forEach((consulta, index) => {
            const item = document.createElement('div');
            item.className = 'admin-consulta-item';
            item.dataset.id = consulta.id || createId('consulta');
            item.style.setProperty('--item-index', index);
            item.innerHTML = `
                <div class="admin-plan-head">
                    <strong>${escapeHtml(consulta.nome)}</strong>
                    <button class="admin-remove-btn" type="button" data-remove-consulta>Remover</button>
                </div>
                <label class="form-group">
                    <span class="form-label">Nome da consulta</span>
                    <input class="form-input" type="text" name="consultaNome" value="${escapeAttribute(consulta.nome)}" required>
                </label>
                <div class="admin-consulta-prices">
                    ${currentPlanos.map((plano, planIndex) => `
                        <label class="form-group">
                            <span class="form-label">${escapeHtml(plano.nome)}</span>
                            <input class="form-input" type="text" name="consultaPreco" data-price-index="${planIndex}" value="${escapeAttribute(consulta.precos[planIndex] || '0,00')}" required>
                        </label>
                    `).join('')}
                </div>
            `;
            adminConsultaList.appendChild(item);
        });
    }

    function readAdminData() {
        const currentPlanos = readAdminPlanos();
        const currentConsultas = readAdminConsultas(currentPlanos.length);

        return {
            planos: currentPlanos,
            consultas: normalizeConsultasForPlanos(currentConsultas, currentPlanos)
        };
    }

    function readAdminPlanos() {
        return Array.from(adminPlanList.querySelectorAll('.admin-plan-item')).map(item => ({
            id: item.dataset.id || createId('plano'),
            nome: item.querySelector('[name="nome"]').value.trim(),
            preco: normalizePreco(item.querySelector('[name="preco"]').value.trim()),
            indicacao: item.querySelector('[name="indicacao"]').value.trim(),
            destaque: item.querySelector('[name="destaque"]').checked,
            badge: item.querySelector('[name="badge"]').value.trim()
        }));
    }

    function readAdminConsultas(planCount) {
        return Array.from(adminConsultaList.querySelectorAll('.admin-consulta-item')).map(item => {
            const precos = Array.from({ length: planCount }, (_, index) => {
                const input = item.querySelector(`[data-price-index="${index}"]`);
                return normalizePreco(input ? input.value.trim() : '0,00') || '0,00';
            });

            return {
                id: item.dataset.id || createId('consulta'),
                nome: item.querySelector('[name="consultaNome"]').value.trim(),
                precos
            };
        });
    }

    async function savePendingChanges() {
        const data = readAdminData();

        if (!data.planos.length) {
            showMessage(adminMessage, 'Mantenha pelo menos um plano cadastrado.', 'error');
            return;
        }

        if (!data.consultas.length) {
            showMessage(adminMessage, 'Mantenha pelo menos uma consulta cadastrada.', 'error');
            return;
        }

        if (data.planos.some(plano => !plano.nome || !plano.preco || !plano.indicacao)) {
            showMessage(adminMessage, 'Preencha nome, valor e indicação de todos os planos.', 'error');
            return;
        }

        if (data.consultas.some(consulta => !consulta.nome || consulta.precos.some(preco => !preco))) {
            showMessage(adminMessage, 'Preencha nome e todos os valores das consultas.', 'error');
            return;
        }

        const nextSnapshot = makeSnapshot(data.planos, data.consultas);

        if (nextSnapshot === savedSnapshot) {
            showMessage(adminMessage, 'Nenhuma alteração pendente.', 'success');
            updateFloatingSaveButton();
            return;
        }

        const confirmed = await confirmDialog({
            title: 'Salvar alterações?',
            text: 'Planos, consultas e valores serão publicados no site e na página de vendas.',
            confirmText: 'Salvar'
        });

        if (!confirmed) {
            return;
        }

        planos = data.planos;
        consultas = data.consultas;
        renderAdmin();
        showMessage(adminMessage, 'Salvando alterações...', 'loading');

        try {
            await saveData(planos, consultas);
            savedSnapshot = makeSnapshot(planos, consultas);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Dados salvos com sucesso.', 'success');
            showAlert({ title: 'Dados salvos', text: 'As alterações já estão disponíveis.' });
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Não foi possível salvar. Verifique sua conexão e tente novamente.', 'error');
        }
    }

    async function saveData(planosToSave, consultasToSave) {
        saveLocal(STORAGE_KEYS.planos, planosToSave);
        saveLocal(STORAGE_KEYS.consultas, consultasToSave);

        const metadata = {
            updatedAt: serverTimestamp(),
            updatedBy: firebaseAuth.currentUser ? firebaseAuth.currentUser.email : null
        };

        await Promise.all([
            setDoc(planosDocRef, { items: planosToSave, ...metadata }),
            setDoc(consultasDocRef, { items: consultasToSave, ...metadata })
        ]);
    }

    function normalizeConsultasForPlanos(consultasToNormalize, planosToUse) {
        return consultasToNormalize.map(consulta => {
            const precos = Array.isArray(consulta.precos) ? [...consulta.precos] : [];

            while (precos.length < planosToUse.length) {
                precos.push('0,00');
            }

            return {
                id: consulta.id || createId('consulta'),
                nome: consulta.nome || 'Consulta',
                precos: precos.slice(0, planosToUse.length).map(preco => normalizePreco(preco) || '0,00')
            };
        });
    }

    function refreshPriceIndexes() {
        adminConsultaList.querySelectorAll('.admin-consulta-prices').forEach(grid => {
            grid.querySelectorAll('[name="consultaPreco"]').forEach((input, index) => {
                input.dataset.priceIndex = index;
            });
        });
    }

    function updateFloatingSaveButton() {
        if (adminPanelSection.hidden) {
            adminFloatingSave.hidden = true;
            return;
        }

        const currentSnapshot = makeSnapshotFromDom();
        const hasChanges = currentSnapshot !== savedSnapshot;

        adminFloatingSave.hidden = !hasChanges;
        adminFloatingSave.textContent = 'Salvar alterações pendentes';
    }

    function makeSnapshotFromDom() {
        const data = readAdminData();
        return makeSnapshot(data.planos, data.consultas);
    }

    function makeSnapshot(planosToSnapshot, consultasToSnapshot) {
        return JSON.stringify({
            planos: planosToSnapshot.map(plano => ({
                id: plano.id,
                nome: String(plano.nome || '').trim(),
                preco: normalizePreco(plano.preco),
                indicacao: String(plano.indicacao || '').trim(),
                destaque: Boolean(plano.destaque),
                badge: String(plano.badge || '').trim()
            })),
            consultas: consultasToSnapshot.map(consulta => ({
                id: consulta.id,
                nome: String(consulta.nome || '').trim(),
                precos: (consulta.precos || []).map(normalizePreco)
            }))
        });
    }

    function loadLocal(key, fallback) {
        const saved = localStorage.getItem(key);

        if (!saved) {
            return cloneItems(fallback);
        }

        try {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) && parsed.length ? parsed : cloneItems(fallback);
        } catch (error) {
            console.error('Erro ao carregar dados locais:', error);
            return cloneItems(fallback);
        }
    }

    function saveLocal(key, items) {
        localStorage.setItem(key, JSON.stringify(items));
    }

    function createId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    function setupScrollReveal() {
        const elements = document.querySelectorAll('.admin-login-card, .section-title, .section-subtitle, .admin-panel, .admin-plan-item, .admin-consulta-item');

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
        }, { threshold: 0.12 });

        elements.forEach(element => {
            element.classList.add('reveal-on-scroll');
            observer.observe(element);
        });
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

    function confirmDialog({ title, text, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
        return new Promise(resolve => {
            openDialog({ title, text, confirmText, cancelText, isConfirm: true, resolve });
        });
    }

    function showAlert({ title, text, confirmText = 'OK' }) {
        return new Promise(resolve => {
            openDialog({ title, text, confirmText, cancelText: '', isConfirm: false, resolve });
        });
    }

    function openDialog({ title, text, confirmText, cancelText, isConfirm, resolve }) {
        adminDialogTitle.textContent = title;
        adminDialogText.textContent = text;
        adminDialogConfirm.textContent = confirmText;
        adminDialogCancel.textContent = cancelText;
        adminDialogCancel.hidden = !isConfirm;
        adminDialog.hidden = false;
        document.body.style.overflow = 'hidden';

        const cleanup = result => {
            adminDialog.hidden = true;
            document.body.style.overflow = '';
            adminDialogConfirm.removeEventListener('click', onConfirm);
            adminDialogCancel.removeEventListener('click', onCancel);
            adminDialog.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        };

        const onConfirm = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onBackdrop = event => {
            if (event.target === adminDialog) {
                cleanup(false);
            }
        };
        const onKeydown = event => {
            if (event.key === 'Escape') {
                cleanup(false);
            }
        };

        adminDialogConfirm.addEventListener('click', onConfirm);
        adminDialogCancel.addEventListener('click', onCancel);
        adminDialog.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKeydown);
        adminDialogConfirm.focus();
    }

    function getLoginErrorMessage(error) {
        const code = error && error.code;

        if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
            return 'E-mail ou senha inválidos.';
        }

        if (code === 'auth/too-many-requests') {
            return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
        }

        if (code === 'auth/network-request-failed') {
            return 'Falha de conexão. Verifique sua internet e tente novamente.';
        }

        return 'Não foi possível entrar. Verifique se o usuário está autorizado.';
    }
});
