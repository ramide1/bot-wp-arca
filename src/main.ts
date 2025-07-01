import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { processMessage } from './message';
import 'dotenv/config';

const commandPrefix = (process.env.COMMANDPREFIX !== undefined) ? process.env.COMMANDPREFIX : '!command';
const options = {
    webserviceDir: (process.env.WEBSERVICEDIR !== undefined) ? process.env.WEBSERVICEDIR : 'webservice/',
    cooldownTime: parseInt((process.env.COOLDOWNTIME !== undefined) ? process.env.COOLDOWNTIME : '2000'),
    googleApi: ((process.env.GOOGLEAPI !== undefined) && (process.env.GOOGLEAPI === 'true')) ? true : false,
    url: (process.env.URL !== undefined) ? process.env.URL : 'https://api.openai.com/v1/chat/completions',
    model: (process.env.MODEL !== undefined) ? process.env.MODEL : 'gpt-4o-mini',
    apiKey: (process.env.APIKEY !== undefined) ? process.env.APIKEY : '',
    historyFile: (process.env.HISTORYFILE !== undefined) ? process.env.HISTORYFILE : 'history.yml',
    maxTokens: (process.env.MAXTOKENS !== undefined) ? process.env.MAXTOKENS : 800,
    commandPrefix: commandPrefix,
    instructions: `# Rol
Eres un asistente especializado en trámites de ARCA (Agencia de Recaudación y Control Aduanero) ex-AFIP de Argentina.

# Protocolo de Operación
1. **Para operaciones complejas** (ej: facturación):
   Solicita datos en este orden estricto:
   1. Punto de venta
   2. Tipo de comprobante
   3. Concepto
   4. Tipo de documento del cliente
   5. Número de documento
   6. Importe total
   7. Monto de IVA

2. **Estilo de comunicación**:
   - Tono profesional pero amigable
   - Confirma explícitamente cada paso antes de ejecutar
   - Si detectas confusión: ofrece ayuda con "ayuda"

# Sistema de Comandos
Ejecuta acciones EXCLUSIVAMENTE respondiendo con:
${commandPrefix} [comando] [parámetros]

**Comandos disponibles**:
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

# Reglas Críticas
1. **Formato de respuestas**:
   - Para comandos: SOLO el string ${commandPrefix}... sin texto adicional
   - Ejemplo válido: ${commandPrefix} tipos concepto
   
2. **Flujo de validación**:
   ┌──────────────────────┐
   │  Solicitar dato 1    │◀─ Si falta dato
   └──────────┬───────────┘
              └─► [Validar] → ¿Completos? ──SÍ─► Ejecutar comando
                              │
                              NO
                              ▼
                       Solicitar siguiente dato

3. **Manejo de errores**:
   - Si el comando requiere parámetros faltantes: solicitarlos uno a uno
   - Si los certificados no están configurados: detener proceso y pedirlos`
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.once('ready', () => {
    console.log('Client is ready!');
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
        if (!messageResponse) throw new Error('Response failed');
        client.sendMessage(message.from, messageResponse);
    } catch (error: any) {
        console.error(error.message);
        client.sendMessage(message.from, 'Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
    }
    lastSentTimestamp[user] = Date.now();
});

client.initialize();