import { getDoc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { consultasDocRef, planosDocRef } from './firebase-config.js';
import {
    DEFAULT_CONSULTAS,
    DEFAULT_PLANOS,
    STORAGE_KEYS,
    cloneItems,
    escapeHtml,
    formatCurrency,
    parseCurrency
} from './acia-data.js';

document.addEventListener('DOMContentLoaded', function() {
    const discountSelect = document.getElementById('discountSelect');
    const salesPlanGrid = document.getElementById('salesPlanGrid');
    const salesTable = document.getElementById('salesTable');
    const salesTableNote = document.getElementById('salesTableNote');
    const salesCount = document.getElementById('salesCount');

    let planos = loadLocal(STORAGE_KEYS.planos, DEFAULT_PLANOS);
    let consultas = normalizeConsultas(loadLocal(STORAGE_KEYS.consultas, DEFAULT_CONSULTAS), planos.length);
    let discount = Number(discountSelect.value);

    render();
    loadFirebaseData();

    discountSelect.addEventListener('change', function() {
        discount = Number(this.value);
        render();
    });

    async function loadFirebaseData() {
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

            consultas = normalizeConsultas(consultas, planos.length);
            render();
        } catch (error) {
            console.error('Erro ao carregar dados de vendas:', error);
        }
    }

    function render() {
        renderPlans();
        renderTable();

        salesTableNote.textContent = discount
            ? `Valores com ${discount}% de desconto aplicado.`
            : 'Valores sem desconto aplicado.';

        salesCount.textContent = `${consultas.length} consultas`;
    }

    function renderPlans() {
        salesPlanGrid.innerHTML = '';

        planos.forEach(plano => {
            const originalValue = parseCurrency(plano.preco);
            const discountedValue = applyDiscount(originalValue);
            const card = document.createElement('article');
            card.className = 'sales-plan-card';
            card.innerHTML = `
                <span>${escapeHtml(plano.nome)}</span>
                <strong>R$ ${formatCurrency(discountedValue)}</strong>
                ${discount ? `<small>Original: R$ ${escapeHtml(plano.preco)}</small>` : '<small>Valor mensal</small>'}
            `;
            salesPlanGrid.appendChild(card);
        });
    }

    function renderTable() {
        const headerCells = planos.map(plano => `<th>Plano R$ ${escapeHtml(plano.preco)}</th>`).join('');
        const rows = consultas.map(consulta => {
            const priceCells = planos.map((plano, index) => {
                const value = parseCurrency(consulta.precos[index]);
                return `<td>R$ ${formatCurrency(applyDiscount(value))}</td>`;
            }).join('');

            return `
                <tr>
                    <th scope="row">${escapeHtml(consulta.nome)}</th>
                    ${priceCells}
                </tr>
            `;
        }).join('');

        salesTable.innerHTML = `
            <thead>
                <tr>
                    <th>Produtos</th>
                    ${headerCells}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        `;
    }

    function applyDiscount(value) {
        return value * (1 - discount / 100);
    }

    function normalizeConsultas(items, planCount) {
        return items.map(consulta => {
            const precos = Array.isArray(consulta.precos) ? [...consulta.precos] : [];

            while (precos.length < planCount) {
                precos.push('0,00');
            }

            return {
                ...consulta,
                precos: precos.slice(0, planCount)
            };
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
});
