import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { processMessage } from './message';
import 'dotenv/config';

const commandPrefix = (process.env.COMMANDPREFIX !== undefined) ? process.env.COMMANDPREFIX : '!command';
const options = {
    webserviceDir: (process.env.WEBSERVICEDIR !== undefined) ? process.env.WEBSERVICEDIR : 'webservice/',
    cooldownTime: parseInt((process.env.COOLDOWNTIME !== undefined) ? process.env.COOLDOWNTIME : '2000'),
    useAi: ((process.env.USEAI !== undefined) && (process.env.USEAI === 'true')) ? true : false,
    googleApi: ((process.env.GOOGLEAPI !== undefined) && (process.env.GOOGLEAPI === 'true')) ? true : false,
    url: (process.env.URL !== undefined) ? process.env.URL : 'https://api.openai.com/v1/chat/completions',
    model: (process.env.MODEL !== undefined) ? process.env.MODEL : 'gpt-4o-mini',
    apiKey: (process.env.APIKEY !== undefined) ? process.env.APIKEY : '',
    historyFile: (process.env.HISTORYFILE !== undefined) ? process.env.HISTORYFILE : 'history.yml',
    maxTokens: (process.env.MAXTOKENS !== undefined) ? process.env.MAXTOKENS : 800,
    commandPrefix: commandPrefix,
    instructions: `La fecha actual es ${(new Date()).toISOString()} . 
Eres un asistente en formato bot de WhatsApp especializado en trámites que interactúa con los servicios web de ARCA (Agencia de Recaudación y Control Aduanero) anteriormente conocido como AFIP de Argentina para realizar consultas y operaciones fiscales. 
Características principales:
- Consulta de puntos de venta habilitados
- Consulta de tipos de comprobantes, conceptos, documentos e IVA
- Consulta de tipos de monedas y cotizaciones
- Consulta de último comprobante autorizado
- Emisión de facturas electrónicas (Facturación Electrónica)
Al hablar con el usuario usar tono profesional pero amigable, emojis cuando se pueda, confirma explícitamente cada paso antes de ejecutar, si detectas confusión ofrece ayuda con "ayuda". 
Eres capaz de ejecutar acciones EXCLUSIVAMENTE respondiendo SIN NINGUN TIPO DE TEXTO ADICIONAL con: ${commandPrefix} [comando] [parámetros] 
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
- Para comandos → SOLO el string ${commandPrefix}... SIN NINGUN TIPO DE TEXTO ADICIONAL
- Ejemplo válido → ${commandPrefix} tipos concepto
Flujo de validación:
- Solicitar dato → Se pide al usuario que ingrese el primer dato requerido
- Validar datos → Se verifica si todos los datos necesarios han sido proporcionados
- Si los datos están completos → Ejecutar comando se procede a realizar la acción principal con los datos ingresados
- Si falta algún dato → Solicitar siguiente dato se pide al usuario que ingrese el siguiente dato requerido
- Volver a validar → Se repite el paso de validación hasta que todos los datos estén completos
Manejo de errores:
- Si el comando requiere parámetros faltantes solicitarlos uno a uno`
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.once('ready', () => {
    console.log('El cliente esta listo!');
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

let lastSentTimestamp: any = {};
client.on('message_create', async (message) => {
    const user = message.from.split('@')[0];
    if (lastSentTimestamp[user] === undefined) lastSentTimestamp[user] = 0;
    if ((Date.now() - lastSentTimestamp[user]) < options.cooldownTime) return;
    try {
        const messageResponse = await processMessage(options, user, message);
        if (!messageResponse) throw new Error('Respuesta fallida');
        client.sendMessage(message.from, messageResponse);
    } catch (error: any) {
        console.error(error.message);
        client.sendMessage(message.from, 'Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
    }
    lastSentTimestamp[user] = Date.now();
});

client.initialize();