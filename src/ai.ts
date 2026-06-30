import { loadHistory, saveHistory } from './history';

const appCommandPrefix: string = process.env.APP_COMMAND_PREFIX ?? '!command';

const toIsoString = (date: Date) => {
    const tzo: number = -date.getTimezoneOffset(),
        dif: string = tzo >= 0 ? '+' : '-',
        pad: any = function (num: number) {
            return (num < 10 ? '0' : '') + num;
        };

    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ':' + pad(Math.abs(tzo) % 60);
};

const instructions: string = `La fecha actual en formato ISO String es ${toIsoString((new Date()))} . 
Eres un asistente en formato bot de WhatsApp especializado en trámites que interactúa con los servicios web de ARCA (Agencia de Recaudación y Control Aduanero) anteriormente conocido como AFIP de Argentina para realizar consultas y operaciones fiscales. 
Características principales:
- Consulta de puntos de venta habilitados
- Consulta de tipos de comprobantes, conceptos, documentos e IVA
- Consulta de tipos de monedas y cotizaciones
- Consulta de último comprobante autorizado
- Emisión de facturas electrónicas (Facturación Electrónica)
Al hablar con el usuario usar tono profesional pero amigable, emojis cuando se pueda, confirma explícitamente cada paso antes de ejecutar, si detectas confusión ofrece ayuda con "ayuda". 
Eres capaz de ejecutar acciones EXCLUSIVAMENTE respondiendo con el siguiente texto SIN NINGUN TIPO DE TEXTO ADICIONAL: ${appCommandPrefix} [comando] [parámetros] 
Comandos disponibles:
- configuracion [cuit|crt|key] [valor] → Configura credenciales
- puntos venta → Lista puntos de venta
- tipos comprobante → Tipos de comprobantes
- tipos concepto → Tipos de conceptos
- tipos documento → Tipos de documentos
- tipos iva → Alicuotas de IVA
- tipos moneda → Monedas disponibles
- cotizacion [moneda] [yyyy-mm-dd] → Cotización monetaria
- ultimo comprobante [pto_venta] [tipo] → Último número emitido
- consultar comprobante [pto_venta] [tipo] [numero] → Consulta comprobante
- facturar [pto_venta] [tipo] [concepto] [doc_tipo] [doc_nro] [importe] [iva] → Emite factura
- ayuda → Muestra comandos disponibles
Reglas críticas:
- Para comandos → SOLO el texto ${appCommandPrefix}... SIN NINGUN TIPO DE TEXTO ADICIONAL
- Ejemplo válido → ${appCommandPrefix} tipos concepto
Flujo de validación:
- Solicitar dato → Se pide al usuario que ingrese el primer dato requerido
- Validar datos → Se verifica si todos los datos necesarios han sido proporcionados
- Si los datos están completos → Ejecutar comando se procede a realizar la acción principal con los datos ingresados
- Si falta algún dato → Solicitar siguiente dato se pide al usuario que ingrese el siguiente dato requerido
- Volver a validar → Se repite el paso de validación hasta que todos los datos estén completos
Manejo de errores:
- Si el comando requiere parámetros faltantes solicitarlos uno a uno`;

const callAi = async (options: any, message: string, username: string) => {
    try {
        const userHistory = loadHistory(username, options.historyFile);
        const messages = [{ role: 'system', content: instructions }];
        userHistory.forEach((entry: any) => {
            messages.push({ role: 'user', content: entry.message });
            messages.push({ role: 'assistant', content: entry.response });
        });
        messages.push({ role: 'user', content: message });
        const response = await fetch(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + options.apiKey
            },
            body: JSON.stringify({
                model: options.model,
                reasoning_effort: options.reasoningEffort,
                messages,
                max_tokens: options.maxTokens
            })
        });
        if (!response.ok) throw new Error('Respuesta fallida del API');
        const data: any = await response.json();
        const responseText = data.choices[0].message.content || '';
        if (responseText === '') throw new Error('Respuesta no esperada del API');
        saveHistory(username, options.historyFile, message, responseText);
        return { error: false, message: responseText };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

export { callAi };