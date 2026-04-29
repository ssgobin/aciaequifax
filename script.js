document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal');
    const modalClose = document.getElementById('modalClose');
    const planoBtns = document.querySelectorAll('.plano-btn');
    const modalForm = document.getElementById('modalForm');
    const modalFormMessage = document.getElementById('modalFormMessage');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');
    const ctaBtn = document.getElementById('ctaBtn');

    planoBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const plano = this.getAttribute('data-plano');
            openModal(plano);
        });
    });

    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            openModal('');
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    function openModal(planoSelecionado) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (planoSelecionado) {
            const modalPlanoSelect = document.getElementById('modalPlano');
            modalPlanoSelect.value = planoSelecionado;
        }

        setTimeout(() => {
            document.getElementById('modalNome').focus();
        }, 100);
    }

    function closeModal() {
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