export const STORAGE_KEYS = {
    planos: 'aciaEquifaxPlanos',
    consultas: 'aciaEquifaxConsultas'
};

export const DEFAULT_PLANOS = [
    { id: 'basic', nome: 'Basic', preco: '69,90', indicacao: 'Ideal para consultas pontuais', destaque: false, badge: '' },
    { id: 'plus', nome: 'Plus', preco: '249,90', indicacao: 'Ideal para pequenas empresas', destaque: false, badge: '' },
    { id: 'premium', nome: 'Premium', preco: '600,00', indicacao: 'Ideal para médias empresas', destaque: true, badge: 'Mais vendido' },
    { id: 'professional', nome: 'Professional', preco: '1.200,00', indicacao: 'Ideal para empresas em crescimento', destaque: false, badge: '' },
    { id: 'business', nome: 'Business', preco: '1.800,00', indicacao: 'Ideal para grandes empresas', destaque: false, badge: '' },
    { id: 'enterprise', nome: 'Enterprise', preco: '7.000,00', indicacao: 'Para alto volume de consultas', destaque: false, badge: '' },
    { id: 'corporate', nome: 'Corporate', preco: '10.000,00', indicacao: 'Para necessidades específicas', destaque: false, badge: '' },
    { id: 'vip', nome: 'VIP', preco: '20.000,00', indicacao: 'Para grandes operações', destaque: false, badge: '' }
];

export const DEFAULT_CONSULTAS = [
    ['acerta-essencial-positivo', 'ACERTA ESSENCIAL POSITIVO', ['15,56', '11,69', '9,47', '7,67', '6,90', '5,03', '4,53', '3,79']],
    ['acerta-mais-positivo', 'ACERTA MAIS POSITIVO', ['24,01', '17,50', '14,18', '11,48', '10,34', '7,54', '6,78', '5,68']],
    ['acerta-completo-positivo', 'ACERTA COMPLETO POSITIVO', ['29,28', '22,00', '17,82', '14,43', '12,99', '9,47', '8,52', '7,13']],
    ['acerta-positivo-inteligencia', 'ACERTA POSITIVO INTELIGÊNCIA (Score, Decisão, Lim. de Parcela e Reda Presumida)', ['8,25', '6,01', '4,87', '3,94', '3,55', '2,59', '2,33', '1,95']],
    ['ic-box-aprova-pf-novos', 'IC BOX APROVA PF (PARA NOVOS CLIENTES)', ['2,95', '2,95', '2,95', '2,95', '2,95', '2,95', '2,95', '2,95']],
    ['ic-box-aprova-pf-clientes', 'IC BOX APROVA PF (PARA JÁ CLIENTES DA BASE)', ['6,95', '6,95', '6,95', '6,95', '6,95', '6,95', '6,95', '6,95']],
    ['combo-acerta-icbox', 'COMBO (ACERTA + IC BOX APROVA)', ['18,67', '14,03', '11,36', '9,20', '8,28', '6,04', '5,43', '4,55']],
    ['define-risco-positivo', 'DEFINE RISCO POSITIVO', ['12,44', '9,35', '7,57', '6,13', '5,52', '4,02', '3,62', '3,03']],
    ['define-negocio-positivo', 'DEFINE NEGOCIO POSITIVO', ['29,28', '22,00', '17,82', '14,43', '12,99', '9,47', '8,52', '7,13']],
    ['define-limite-positivo', 'DEFINE LIMITE POSITIVO', ['43,92', '33,00', '26,73', '21,65', '19,49', '14,21', '12,78', '10,70']],
    ['define-positivo-inteligencia', 'DEFINE POSITIVO INTELIGÊNCIA (Score, Decisão, Lim. de Crédito e Fat. Presumido)', ['8,25', '6,01', '4,87', '3,94', '3,55', '2,59', '2,33', '1,95']],
    ['acerta-essencial', 'ACERTA ESSENCIAL', ['12,44', '9,35', '7,57', '6,13', '5,52', '4,02', '3,62', '3,03']],
    ['acerta-cheque', 'ACERTA CHEQUE', ['5,57', '4,06', '3,29', '2,67', '2,40', '1,75', '1,57', '1,32']],
    ['scpc-net-pf', 'SCPC NET PF', ['10,65', '7,77', '6,29', '5,09', '4,59', '3,34', '3,01', '2,52']],
    ['scpc-net-pj', 'SCPC NET PJ', ['10,65', '7,77', '6,29', '5,09', '4,59', '3,34', '3,01', '2,52']],
    ['valida-id-cadastral', 'VALIDA ID - CADASTRAL', ['0,36', '0,32', '0,30', '0,27', '0,26', '0,23', '0,22', '0,21']],
    ['valida-id-cadastral-completo', 'VALIDA ID - CADASTRAL COMPLETO', ['0,73', '0,64', '0,60', '0,55', '0,53', '0,47', '0,45', '0,42']],
    ['valida-id-localizacao', 'VALIDA ID - LOCALIZAÇÃO', ['0,10', '0,09', '0,08', '0,08', '0,07', '0,07', '0,06', '0,06']],
    ['valida-id-qualificacao', 'VALIDA ID - QUALIFICAÇÃO', ['0,10', '0,09', '0,08', '0,08', '0,07', '0,07', '0,06', '0,06']],
    ['score-de-credito-pf-pj', 'SCORE DE CRÉDITO PF/PJ', ['8,25', '6,01', '4,87', '3,94', '3,55', '2,59', '2,33', '1,95']],
    ['acerta-inteligencia', 'ACERTA INTELIGÊNCIA (Decisão, Lim. de Parcela e Renda Presumida)', ['8,25', '6,01', '4,87', '3,94', '3,55', '2,59', '2,33', '1,95']],
    ['score-recuperacao-pf-pj', 'SCORE RECUPERAÇÃO PF/PJ', ['0,17', '0,15', '0,15', '0,13', '0,13', '0,11', '0,11', '0,10']],
    ['quadro-social-participacao', 'QUADRO SOCIAL/PARTICIPAÇÃO EM OUTRAS EMPRESAS', ['5,40', '3,94', '3,19', '2,58', '2,32', '1,69', '1,53', '1,28']],
    ['quadro-social-restricao', 'QUADRO SOCIAL COM RESTRIÇÃO/PARTICIPAÇÃO COM RESTRIÇÃO', ['10,88', '7,93', '6,43', '5,20', '4,68', '3,41', '3,07', '2,57']],
    ['define-complementos', 'DEFINE COMPLEMENTOS (Cadastral, Restritivo, Q. Social e Participação)', ['3,18', '2,32', '1,88', '1,52', '1,37', '1,00', '0,90', '0,75']],
    ['define-opcionais', 'DEFINE OPCIONAIS (Anvisa, Folha Cheque e Mesmo Endereço)', ['0,84', '0,61', '0,50', '0,40', '0,36', '0,26', '0,24', '0,20']],
    ['define-extras', 'DEFINE EXTRAS', ['1,39', '1,01', '0,82', '0,66', '0,60', '0,43', '0,39', '0,33']],
    ['define-cadastro', 'DEFINE CADASTRO', ['2,75', '2,75', '2,75', '2,75', '2,75', '2,75', '2,75', '2,75']],
    ['gc-1-atributo', 'GC - 1 ATRIBUTO', ['7,64', '6,57', '6,38', '6,26', '6,19', '5,89', '5,25', '4,58']],
    ['gc-2-atributos', 'GC - 2 ATRIBUTOS', ['9,43', '8,72', '8,20', '7,96', '7,79', '7,19', '6,84', '6,28']],
    ['gc-3-atributos', 'GC - 3 ATRIBUTOS', ['14,76', '13,34', '10,87', '10,52', '10,29', '9,67', '9,53', '8,67']],
    ['gc-4-atributos', 'GC - 4 ATRIBUTOS', ['15,82', '15,33', '14,84', '14,54', '14,13', '13,09', '12,91', '12,38']],
    ['gc-5-atributos', 'GC - 5 ATRIBUTOS', ['17,77', '17,23', '16,66', '16,27', '16,01', '14,66', '14,56', '14,08']],
    ['carta-simples', 'CARTA SIMPLES', ['16,14', '14,73', '13,86', '13,04', '12,65', '11,55', '11,20', '10,54']],
    ['carta-com-boleto', 'CARTA COM BOLETO', ['16,14', '14,73', '13,86', '13,04', '12,65', '11,55', '11,20', '10,54']],
    ['scpc-comunica-carta', 'SCPC COMUNICA CARTA', ['16,14', '14,73', '13,86', '13,04', '12,65', '11,55', '11,20', '10,54']],
    ['scpc-comunica-email-sms', 'SCPC COMUNICA EMAIL/SMS', ['4,09', '3,73', '3,51', '3,31', '3,21', '2,93', '2,84', '2,67']],
    ['aviso-eletronico-debito-pf-pj', 'AVISO ELETRONICO DE DEBITO PF/PJ', ['4,09', '3,73', '3,51', '3,31', '3,21', '2,93', '2,84', '2,67']],
    ['sms-recupera-mais-pf-pj', 'SMS RECUPERA MAIS PF/PJ', ['4,09', '3,73', '3,51', '3,31', '3,21', '2,93', '2,84', '2,67']],
    ['consulta-historico-mercado-pf-pj', 'CONSULTA HISTÓRICO MERCADO PF/PJ', ['35,83', '35,83', '35,83', '35,83', '35,83', '35,83', '35,83', '35,83']],
    ['consulta-historico-proprio-grupo-pf-pj', 'CONSULTA HISTÓRICO PRÓPRIO GRUPO PF/PJ', ['14,19', '14,19', '14,19', '14,19', '14,19', '14,19', '14,19', '14,19']]
].map(([id, nome, precos]) => ({ id, nome, precos }));

export function cloneItems(items) {
    return items.map(item => ({
        ...item,
        precos: Array.isArray(item.precos) ? [...item.precos] : item.precos
    }));
}

export function normalizePreco(preco) {
    return String(preco || '').replace(/^R\$\s*/i, '').trim();
}

export function parseCurrency(value) {
    const normalized = normalizePreco(value).replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function getPrecoParts(preco) {
    const normalizedPreco = String(preco || '0,00').trim();
    const [reais, centavos = '00'] = normalizedPreco.split(',');

    return {
        reais: `R$ ${reais}`,
        centavos: `,${centavos.padEnd(2, '0').slice(0, 2)}`
    };
}

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
}
