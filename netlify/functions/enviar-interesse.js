const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { nome, celular, email, associado, plano, empresa, cnpj, observacao, dataEnvio } = data;

        if (!nome || !celular || !email || !associado || !plano) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Campos obrigatórios faltando' })
            };
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.acia.com.br',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'contato@acia.com.br',
                pass: process.env.SMTP_PASS || 'Acia@2026'
            }
        });

        const mailTo = process.env.MAIL_TO || 'scpc@acia.com.br';
        const mailFrom = process.env.MAIL_FROM || 'contato@acia.com.br';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .email-wrapper { background: #f8f9fa; padding: 30px 0; }
        .header { background: linear-gradient(135deg, #1e3a5f, #234d7a); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { font-size: 1.5rem; margin-bottom: 5px; }
        .header p { opacity: 0.9; font-size: 0.95rem; }
        .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .field { margin-bottom: 20px; }
        .field:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #1e3a5f; font-size: 0.9rem; margin-bottom: 6px; display: block; }
        .value { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 1rem; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; }
        .badge-sim { background: #d4edda; color: #155724; }
        .badge-nao { background: #f8d7da; color: #721c24; }
        .badge-associar { background: #fff3cd; color: #856404; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.85rem; }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <h1>Novo Interesse nos Planos Equifax Boa Vista</h1>
                <p>ACIA - Associação Comercial e Industrial</p>
            </div>
            <div class="content">
                <div class="field">
                    <span class="label">Nome completo</span>
                    <div class="value">${nome}</div>
                </div>
                <div class="field">
                    <span class="label">Celular/WhatsApp</span>
                    <div class="value">${celular}</div>
                </div>
                <div class="field">
                    <span class="label">E-mail</span>
                    <div class="value">${email}</div>
                </div>
                <div class="field">
                    <span class="label">Asociado ACIA</span>
                    <div class="value">
                        <span class="badge ${associado === 'Sim' ? 'badge-sim' : associado === 'Não' ? 'badge-nao' : 'badge-associar'}">${associado}</span>
                    </div>
                </div>
                <div class="field">
                    <span class="label">Plano de interesse</span>
                    <div class="value">${plano}</div>
                </div>
                ${empresa ? `
                <div class="field">
                    <span class="label">Nome da empresa</span>
                    <div class="value">${empresa}</div>
                </div>
                ` : ''}
                ${cnpj ? `
                <div class="field">
                    <span class="label">CNPJ</span>
                    <div class="value">${cnpj}</div>
                </div>
                ` : ''}
                ${observacao ? `
                <div class="field">
                    <span class="label">Observação</span>
                    <div class="value">${observacao}</div>
                </div>
                ` : ''}
                <div class="field">
                    <span class="label">Data e hora do envio</span>
                    <div class="value">${dataEnvio}</div>
                </div>
            </div>
            <div class="footer">
                <p>E-mail enviado automaticamente pelo site da ACIA</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const textContent = `
NOVO INTERESSADO NOS PLANOS EQUIFAX BOA VISTA - ACIA
===============================================

Nome completo: ${nome}
Celular/WhatsApp: ${celular}
E-mail: ${email}
Associado ACIA: ${associado}
Plano de interesse: ${plano}
${empresa ? `Nome da empresa: ${empresa}` : ''}
${cnpj ? `CNPJ: ${cnpj}` : ''}
${observacao ? `Observação: ${observacao}` : ''}
Data e hora do envio: ${dataEnvio}
        `;

        const info = await transporter.sendMail({
            from: mailFrom,
            to: mailTo,
            subject: 'Novo interessado nos planos Equifax Boa Vista - ACIA',
            text: textContent,
            html: htmlContent
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'E-mail enviado com sucesso',
                messageId: info.messageId 
            })
        };

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Erro ao enviar e-mail',
                details: error.message 
            })
        };
    }
};