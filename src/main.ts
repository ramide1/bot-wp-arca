import { Client, LocalAuth } from 'whatsapp-web.js';
import { processMessage } from './message';
import { saveYaml, loadYaml } from './file';
import express from 'express';
import qrcode from 'qrcode';
import 'dotenv/config';

const commandPrefix: string = (process.env.COMMANDPREFIX !== undefined) ? process.env.COMMANDPREFIX : '!command';
const options: any = {
    webserviceDir: (process.env.WEBSERVICEDIR !== undefined) ? process.env.WEBSERVICEDIR : 'webservice/',
    cooldownTime: parseInt((process.env.COOLDOWNTIME !== undefined) ? process.env.COOLDOWNTIME : '2000'),
    useAi: ((process.env.USEAI !== undefined) && (process.env.USEAI === 'true')) ? true : false,
    googleApi: ((process.env.GOOGLEAPI !== undefined) && (process.env.GOOGLEAPI === 'true')) ? true : false,
    url: (process.env.URL !== undefined) ? process.env.URL : 'https://api.openai.com/v1/chat/completions',
    model: (process.env.MODEL !== undefined) ? process.env.MODEL : 'gpt-4o-mini',
    apiKey: (process.env.APIKEY !== undefined) ? process.env.APIKEY : '',
    historyFile: (process.env.HISTORYFILE !== undefined) ? process.env.HISTORYFILE : 'history.yml',
    maxTokens: parseInt((process.env.MAXTOKENS !== undefined) ? process.env.MAXTOKENS : '800'),
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
Eres capaz de ejecutar acciones EXCLUSIVAMENTE respondiendo con el siguiente texto SIN NINGUN TIPO DE TEXTO ADICIONAL: ${commandPrefix} [comando] [parámetros] 
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
- Para comandos → SOLO el texto ${commandPrefix}... SIN NINGUN TIPO DE TEXTO ADICIONAL
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
const appPort: number = parseInt((process.env.APPPORT !== undefined) ? process.env.APPPORT : '3000');
const appMasterKey: string = (process.env.MASTERKEY !== undefined) ? process.env.MASTERKEY : '';
const apiEndpoint: string = (process.env.APIENDPOINT !== undefined) ? process.env.APIENDPOINT : 'api/';
const clientsFile: string = (process.env.CLIENTSFILE !== undefined) ? process.env.CLIENTSFILE : 'clients.yml';
const onlyUserMessages = ((process.env.ONLYUSERMESSAGES !== undefined) && (process.env.ONLYUSERMESSAGES === 'true')) ? true : false;
const appSessions: any = {};
const createClient = (uuid: string, save: boolean = true) => {
    try {
        appSessions[uuid] = {
            client: null,
            image: false,
            lastsenttimestamp: []
        };
        appSessions[uuid].client = new Client({
            authStrategy: new LocalAuth({ clientId: uuid }),
            puppeteer: { headless: true }
        });

        appSessions[uuid].client.on('qr', async (qr: any) => {
            appSessions[uuid].image = await qrcode.toDataURL(qr);
        });

        appSessions[uuid].client.on('message_create', async (message: any) => {
            if (onlyUserMessages && (!message.fromMe || (message.to != message.from))) return;
            const user = message.from.split('@')[0];
            if (appSessions[uuid].lastsenttimestamp[user] === undefined) appSessions[uuid].lastsenttimestamp[user] = 0;
            if ((Date.now() - appSessions[uuid].lastsenttimestamp[user]) < options.cooldownTime) return;
            try {
                const messageResponse = await processMessage(options, user, message);
                if (!messageResponse) throw new Error('Respuesta fallida');
                appSessions[uuid].client.sendMessage(message.from, messageResponse);
            } catch (error: any) {
                appSessions[uuid].client.sendMessage(message.from, error.message);
            }
            appSessions[uuid].lastsenttimestamp[user] = Date.now();
        });

        appSessions[uuid].client.initialize();
        if (save) {
            const savedClients = loadYaml(clientsFile) || [];
            savedClients.push(uuid);
            if (!saveYaml(clientsFile, savedClients)) throw new Error('Error al guardar el cliente.');
        }
        return true;
    } catch (error: any) {
        appSessions[uuid] = undefined;
        return false;
    }
};
const deleteClient = (uuid: string) => {
    try {
        const savedClients = loadYaml(clientsFile) || [];
        const newData = savedClients.filter((client: string) => client != uuid);
        if (!saveYaml(clientsFile, newData)) throw new Error('Error al borrar el cliente.');
        appSessions[uuid] = undefined;
        return true;
    } catch (error: any) {
        return false;
    }
};
const app: any = express();
app.use(express.json());

app.get('/', (_req: any, res: any) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bot WhatsApp Arca</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        #qrImage {
            margin: 20px 0;
            max-width: 100%;
        }
        .status {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .waiting { background-color: #fff3cd; color: #856404; }
        .ready { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .instructions {
            margin: 20px 0;
            text-align: left;
            color: #555;
        }
        .instructions ol {
            padding-left: 20px;
        }
        button {
            background-color: #075e54;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        }
        button:hover {
            background-color: #128c7e;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Configuración de tu Bot de WhatsApp de Arca</h1>
        <img id="arcaImage" style="width:100%;" src="data:image/png;base64,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" alt="Arca Image"/>
        <div id="status" class="status waiting">Esperando código QR...</div>
        <img id="qrImage" style="display: none;" alt="QR Code"/>
        <div class="instructions">
            <ol>
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Toca <strong>Menú</strong> → <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>Vincular un dispositivo</strong></li>
                <li>Escanea este código QR</li>
            </ol>
        </div>
        <button id="newBotBtn" style="display: none;">Configurar otro bot</button>
    </div>
    <script>
        let checkStatusInterval;
        let uuid = false;
        const checkStatus = async () => {
            if (uuid) {
                const response = await fetch('/' + '${apiEndpoint}' + 'status', {
                    method: 'POST',
                    headers: { 'Content-type': 'application/json;charset=UTF-8' },
                    body: JSON.stringify({
                        uuid: uuid
                    })
                });
                const data = await response.json();
                document.getElementById('status').textContent = data.message;
                if (!data.error) {
                    document.getElementById('qrImage').src = data.image;
                    document.getElementById('qrImage').style.display = 'block';
                    document.getElementById('status').className = 'status ready';
                    document.getElementById('newBotBtn').style.display = 'block';
                    clearInterval(checkStatusInterval);
                } else {
                    document.getElementById('status').className = 'status waiting';
                }
            }
        };
        const createClient = async () => {
            const response = await fetch('/' + '${apiEndpoint}' + 'create', {
                method: 'POST',
                headers: { 'Content-type': 'application/json;charset=UTF-8' },
            });
            const data = await response.json();  
            document.getElementById('status').textContent = data.message;
            if (!data.error) {
                uuid = data.uuid;
                document.getElementById('status').className = 'status ready';
            } else {
                document.getElementById('status').className = 'status error';
            }
        };
        document.getElementById('newBotBtn').addEventListener('click', () => {
            window.location.reload();
        });
        checkStatusInterval = setInterval(checkStatus, 1000);
        createClient();
    </script>
</body>
</html>`);
});

app.post('/' + apiEndpoint + 'create', (_req: any, res: any) => {
    const uuid = Date.now().toString(36) + Math.random().toString(36).substr(2);
    try {
        if (!createClient(uuid)) throw new Error('Error al crear el cliente.');
        res.json({ error: false, message: '¡UUID listo para usar!', uuid: uuid });
    } catch (error: any) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.post('/' + apiEndpoint + 'status', (req: any, res: any) => {
    const uuid = req.body.uuid;
    try {
        if (appSessions[uuid] === undefined) throw new Error('Ocurrió un error al obtener el uuid. Por favor intenta nuevamente.');
        if (!appSessions[uuid].image) throw new Error('Generando el QR. Por favor espere.');
        res.json({ error: false, message: '¡QR listo para usar!', image: appSessions[uuid].image });
    } catch (error: any) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.post('/' + apiEndpoint + 'delete', (req: any, res: any) => {
    const uuid = req.body.uuid;
    try {
        if ((appMasterKey != '') && (!req.body.masterkey || (req.body.masterkey != appMasterKey))) throw new Error('Clave no informada.');
        if (appSessions[uuid] === undefined) throw new Error('Ocurrió un error al obtener el uuid. Por favor intenta nuevamente.');
        if (!deleteClient(uuid)) throw new Error('Error al borrar el cliente.');
        res.json({ error: false, message: '¡QR borrado con exito!', uuid: uuid });
    } catch (error: any) {
        res.status(500).json({ error: true, message: error.message });
    }
});

app.listen(appPort, () => {
    console.log('App escuchando en el puerto ' + appPort);
    const savedClients = loadYaml(clientsFile) || [];
    savedClients.forEach((e: any) => {
        if (!createClient(e, false)) console.log('Error al crear el cliente guardado: ' + e);
    });
});