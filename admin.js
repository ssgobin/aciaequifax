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
import { firebaseAuth, planosDocRef } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'aciaEquifaxPlanos';
    const DEFAULT_PLANOS = [
        { id: 'basic', nome: 'Basic', preco: '69,90', indicacao: 'Ideal para consultas pontuais', destaque: false, badge: '' },
        { id: 'plus', nome: 'Plus', preco: '249,90', indicacao: 'Ideal para pequenas empresas', destaque: false, badge: '' },
        { id: 'premium', nome: 'Premium', preco: '600,00', indicacao: 'Ideal para médias empresas', destaque: true, badge: 'Mais vendido' },
        { id: 'business', nome: 'Business', preco: '1.800,00', indicacao: 'Ideal para grandes empresas', destaque: false, badge: '' },
        { id: 'enterprise', nome: 'Enterprise', preco: '7.000,00', indicacao: 'Para alto volume de consultas', destaque: false, badge: '' },
        { id: 'corporate', nome: 'Corporate', preco: '10.000,00', indicacao: 'Para necessidades específicas', destaque: false, badge: '' },
        { id: 'vip', nome: 'VIP', preco: '20.000,00', indicacao: 'Para grandes operações', destaque: false, badge: '' }
    ];

    const loginSection = document.getElementById('loginSection');
    const adminPanelSection = document.getElementById('adminPanelSection');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPlanList = document.getElementById('adminPlanList');
    const adminAddPlan = document.getElementById('adminAddPlan');
    const adminSavePlans = document.getElementById('adminSavePlans');
    const adminResetPlans = document.getElementById('adminResetPlans');
    const adminMessage = document.getElementById('adminMessage');
    const adminDialog = document.getElementById('adminDialog');
    const adminDialogTitle = document.getElementById('adminDialogTitle');
    const adminDialogText = document.getElementById('adminDialogText');
    const adminDialogCancel = document.getElementById('adminDialogCancel');
    const adminDialogConfirm = document.getElementById('adminDialogConfirm');
    const adminFloatingSave = document.getElementById('adminFloatingSave');

    let planos = loadLocalPlanos();
    let savedPlanosSnapshot = clonePlanos(planos);
    let hasLoadedAdminPlanos = false;

    setupScrollReveal();

    onAuthStateChanged(firebaseAuth, function(user) {
        const isLoggedIn = Boolean(user);

        loginSection.hidden = isLoggedIn;
        adminPanelSection.hidden = !isLoggedIn;
        logoutBtn.hidden = !isLoggedIn;

        if (isLoggedIn && !hasLoadedAdminPlanos) {
            hasLoadedAdminPlanos = true;
            showMessage(adminMessage, 'Tudo certo. Carregando planos...', 'loading');
            loadFirebasePlanos();
            setupScrollReveal();
        } else {
            updateFloatingSaveButton();
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput = loginForm.querySelector('[name="email"]');
            const passwordInput = loginForm.querySelector('[name="password"]');
            const email = emailInput.value.trim();
            const password = passwordInput.value;

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
                text: 'Você precisará informar e-mail e senha novamente para editar os planos.',
                confirmText: 'Sair'
            });

            if (!confirmed) {
                return;
            }

            await signOut(firebaseAuth);
            hasLoadedAdminPlanos = false;
            adminPlanList.innerHTML = '';
            updateFloatingSaveButton();
        });
    }

    if (adminAddPlan) {
        adminAddPlan.addEventListener('click', function() {
            planos = readAdminPlanos();
            planos.push({
                id: createPlanId(),
                nome: 'Novo plano',
                preco: '0,00',
                indicacao: 'Descreva a indicação do plano',
                destaque: false,
                badge: ''
            });
            renderAdminPlanos();
            setupScrollReveal();
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Novo plano adicionado. Revise os dados e salve.', 'loading');
        });
    }

    if (adminSavePlans) {
        adminSavePlans.addEventListener('click', savePendingChanges);
    }

    if (adminFloatingSave) {
        adminFloatingSave.addEventListener('click', savePendingChanges);
    }

    if (adminResetPlans) {
        adminResetPlans.addEventListener('click', async function() {
            const confirmed = await confirmDialog({
                title: 'Restaurar planos padrão?',
                text: 'Essa ação substitui a lista atual pelos planos originais do site.',
                confirmText: 'Restaurar'
            });

            if (!confirmed) {
                return;
            }

            planos = clonePlanos(DEFAULT_PLANOS);
            renderAdminPlanos();
            setupScrollReveal();
            showMessage(adminMessage, 'Restaurando planos...', 'loading');

            try {
                await savePlanos(planos);
                savedPlanosSnapshot = clonePlanos(planos);
                updateFloatingSaveButton();
                showMessage(adminMessage, 'Planos restaurados para os valores padrão.', 'success');
                showAlert({
                    title: 'Planos restaurados',
                    text: 'A lista padrão já está disponível no site.'
                });
            } catch (error) {
                console.error('Erro ao restaurar planos:', error);
                showMessage(adminMessage, 'Os planos foram restaurados nesta tela, mas não foi possível publicar a alteração.', 'error');
                showAlert({
                    title: 'Erro ao restaurar',
                    text: 'Os planos foram restaurados na tela, mas não foi possível publicar a alteração.'
                });
            }
        });
    }

    if (adminPlanList) {
        adminPlanList.addEventListener('click', function(e) {
            const removeButton = e.target.closest('[data-remove-plan]');
            if (!removeButton) {
                return;
            }

            const planItem = removeButton.closest('.admin-plan-item');
            const planName = planItem.querySelector('[name="nome"]').value.trim() || 'este plano';

            confirmDialog({
                title: 'Remover plano?',
                text: `Você está removendo "${planName}" da lista. A remoção só será aplicada no site depois de salvar.`,
                confirmText: 'Remover'
            }).then(confirmed => {
                if (!confirmed) {
                    return;
                }

                planItem.remove();
                updateFloatingSaveButton();
                showMessage(adminMessage, 'Plano removido da edição. Clique em salvar para aplicar.', 'loading');
            });
        });
    }

    if (adminPlanList) {
        adminPlanList.addEventListener('input', updateFloatingSaveButton);
        adminPlanList.addEventListener('change', updateFloatingSaveButton);
    }

    async function loadFirebasePlanos() {
        renderAdminPlanos();
        showMessage(adminMessage, 'Carregando planos...', 'loading');

        try {
            const docSnapshot = await getDoc(planosDocRef);

            if (docSnapshot.exists()) {
                const firebasePlanos = docSnapshot.data().items;

                if (Array.isArray(firebasePlanos) && firebasePlanos.length) {
                    planos = firebasePlanos;
                    savedPlanosSnapshot = clonePlanos(planos);
                    saveLocalPlanos(planos);
                }
            }

            renderAdminPlanos();
            setupScrollReveal();
            updateFloatingSaveButton();
            adminMessage.style.display = 'none';
        } catch (error) {
            console.error('Erro ao carregar planos atualizados:', error);
            renderAdminPlanos();
            savedPlanosSnapshot = clonePlanos(planos);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Não foi possível carregar os dados atualizados. Exibindo uma cópia salva neste navegador.', 'error');
        }
    }

    function loadLocalPlanos() {
        const savedPlanos = localStorage.getItem(STORAGE_KEY);

        if (!savedPlanos) {
            return clonePlanos(DEFAULT_PLANOS);
        }

        try {
            const parsedPlanos = JSON.parse(savedPlanos);
            return Array.isArray(parsedPlanos) && parsedPlanos.length ? parsedPlanos : clonePlanos(DEFAULT_PLANOS);
        } catch (error) {
            console.error('Erro ao carregar planos locais:', error);
            return clonePlanos(DEFAULT_PLANOS);
        }
    }

    function saveLocalPlanos(planosToSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(planosToSave));
    }

    async function savePlanos(planosToSave) {
        saveLocalPlanos(planosToSave);

        await setDoc(planosDocRef, {
            items: planosToSave,
            updatedAt: serverTimestamp(),
            updatedBy: firebaseAuth.currentUser ? firebaseAuth.currentUser.email : null
        });
    }

    function clonePlanos(planosToClone) {
        return planosToClone.map(plano => ({ ...plano }));
    }

    function createPlanId() {
        return 'plano-' + Date.now();
    }

    function renderAdminPlanos() {
        if (!adminPlanList) {
            return;
        }

        adminPlanList.innerHTML = '';

        planos.forEach((plano, index) => {
            const item = document.createElement('div');
            item.className = 'admin-plan-item';
            item.dataset.id = plano.id || createPlanId();
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

    function setupScrollReveal() {
        const elements = document.querySelectorAll('.admin-login-card, .section-title, .section-subtitle, .admin-panel, .admin-plan-item');

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

    function readAdminPlanos() {
        if (!adminPlanList) {
            return [];
        }

        return Array.from(adminPlanList.querySelectorAll('.admin-plan-item')).map(item => ({
            id: item.dataset.id || createPlanId(),
            nome: item.querySelector('[name="nome"]').value.trim(),
            preco: normalizePreco(item.querySelector('[name="preco"]').value.trim()),
            indicacao: item.querySelector('[name="indicacao"]').value.trim(),
            destaque: item.querySelector('[name="destaque"]').checked,
            badge: item.querySelector('[name="badge"]').value.trim()
        }));
    }

    async function savePendingChanges() {
        const updatedPlanos = readAdminPlanos();

        if (!updatedPlanos.length) {
            showMessage(adminMessage, 'Mantenha pelo menos um plano cadastrado.', 'error');
            return;
        }

        if (updatedPlanos.some(plano => !plano.nome || !plano.preco || !plano.indicacao)) {
            showMessage(adminMessage, 'Preencha nome, valor e indicação de todos os planos.', 'error');
            showAlert({
                title: 'Campos obrigatórios',
                text: 'Preencha nome, valor e indicação de todos os planos antes de salvar.'
            });
            return;
        }

        const changedCount = getChangedPlanCount(updatedPlanos, savedPlanosSnapshot);

        if (!changedCount) {
            showMessage(adminMessage, 'Nenhuma alteração pendente.', 'success');
            updateFloatingSaveButton();
            return;
        }

        const confirmed = await confirmDialog({
            title: 'Salvar alterações?',
            text: `${formatChangedCount(changedCount)} serão publicados no site.`,
            confirmText: 'Salvar'
        });

        if (!confirmed) {
            return;
        }

        planos = updatedPlanos;
        renderAdminPlanos();
        setupScrollReveal();
        showMessage(adminMessage, 'Salvando alterações...', 'loading');

        try {
            await savePlanos(planos);
            savedPlanosSnapshot = clonePlanos(planos);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Planos salvos com sucesso.', 'success');
            showAlert({
                title: 'Planos salvos',
                text: 'As alterações já estão disponíveis no site.'
            });
        } catch (error) {
            console.error('Erro ao salvar planos:', error);
            updateFloatingSaveButton();
            showMessage(adminMessage, 'Não foi possível salvar. Verifique sua conexão e tente novamente.', 'error');
            showAlert({
                title: 'Erro ao salvar',
                text: 'Não foi possível concluir o salvamento. Verifique sua conexão e tente novamente.'
            });
        }
    }

    function updateFloatingSaveButton() {
        if (!adminFloatingSave) {
            return;
        }

        if (adminPanelSection.hidden) {
            adminFloatingSave.hidden = true;
            return;
        }

        const currentPlanos = readAdminPlanos();
        const changedCount = getChangedPlanCount(currentPlanos, savedPlanosSnapshot);

        adminFloatingSave.hidden = changedCount === 0;
        adminFloatingSave.textContent = changedCount === 1
            ? 'Salvar 1 plano editado'
            : `Salvar ${changedCount} planos editados`;
    }

    function getChangedPlanCount(currentPlanos, savedPlanos) {
        const savedById = new Map(savedPlanos.map(plano => [plano.id, normalizePlanForCompare(plano)]));
        const currentIds = new Set();
        let changedCount = 0;

        currentPlanos.forEach(plano => {
            currentIds.add(plano.id);
            const normalizedPlan = normalizePlanForCompare(plano);
            const savedPlan = savedById.get(plano.id);

            if (!savedPlan || JSON.stringify(normalizedPlan) !== JSON.stringify(savedPlan)) {
                changedCount += 1;
            }
        });

        savedPlanos.forEach(plano => {
            if (!currentIds.has(plano.id)) {
                changedCount += 1;
            }
        });

        return changedCount;
    }

    function normalizePlanForCompare(plano) {
        return {
            id: plano.id,
            nome: String(plano.nome || '').trim(),
            preco: normalizePreco(String(plano.preco || '').trim()),
            indicacao: String(plano.indicacao || '').trim(),
            destaque: Boolean(plano.destaque),
            badge: String(plano.badge || '').trim()
        };
    }

    function formatChangedCount(count) {
        return count === 1 ? '1 plano editado' : `${count} planos editados`;
    }

    function normalizePreco(preco) {
        return preco.replace(/^R\$\s*/i, '').trim();
    }

    function showMessage(element, message, type) {
        if (!element) {
            return;
        }

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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#096;');
    }
});
