import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { FEParamGetPtosVenta, FEParamGetTiposCbte, FEParamGetTiposConcepto, FEParamGetTiposDoc, FEParamGetTiposIva, FEParamGetTiposMonedas, FEParamGetCotizacion, FECompUltimoAutorizado, FECompConsultar, FECAESolicitar } from "./arca";
import { saveYaml, loadYaml, saveBase64 } from './file';
import 'dotenv/config';

const options = {
    webserviceDir: (process.env.WEBSERVICEDIR !== undefined) ? process.env.WEBSERVICEDIR : 'webservice/',
    cooldownTime: parseInt((process.env.COOLDOWNTIME !== undefined) ? process.env.COOLDOWNTIME : '2000'),
}

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

let lastSentTimestamp = Date.now();
client.on('message_create', async (message) => {
    if ((Date.now() - lastSentTimestamp) < options.cooldownTime) return;
    let responseText = 'Error al obtener respuesta. Intentá nuevamente más tarde.';
    try {
        const messageText = message.body.trim().toLowerCase();
        const userDir = options.webserviceDir + message.from.split('@')[0] + '/';
        const yamlFile = userDir + 'userdata.yml';
        const yamlData = loadYaml(yamlFile) || {};
        const messageArray = messageText.split(' ');
        if (messageText.includes('configuracion')) {
            if (messageArray.length < 2) throw new Error('Por favor enviá el parametro a configurar.');
            const parametro = messageArray[1];
            if (parametro == 'cuit') {
                if (messageArray.length < 3) throw new Error('No se detecto CUIT valido luego del parametro.');
                const cuit = messageArray[2];
                if (!saveYaml(yamlFile, { ...yamlData, ...{ cuit } })) throw new Error('Error al guardar los datos.');
                responseText = 'CUIT ' + cuit + ' configurado correctamente.';
            } else if (parametro == 'crt') {
                if (!message.hasMedia) throw new Error('No se detecto archivo CRT adjunto en el mensaje.');
                const media = await message.downloadMedia();
                const base64File = userDir + 'ghf.crt';
                if (!saveBase64(base64File, media.data)) throw new Error('Error al guardar CRT.');
                if (!saveYaml(yamlFile, { ...yamlData, ...{ crt: true } })) throw new Error('Error al guardar los datos.');
                responseText = 'CRT configurado correctamente.';
            } else if (parametro == 'key') {
                if (!message.hasMedia) throw new Error('No se detecto archivo KEY adjunto en el mensaje.');
                const media = await message.downloadMedia();
                const base64File = userDir + 'ghf.key';
                if (!saveBase64(base64File, media.data)) throw new Error('Error al guardar KEY.');
                if (!saveYaml(yamlFile, { ...yamlData, ...{ key: true } })) throw new Error('Error al guardar los datos.');
                responseText = 'KEY configurado correctamente.';
            } else {
                throw new Error('No se detecto un parametro valido. Solo se acepta cuit, crt o key.');
            }
        } else if (messageText.includes('puntos venta')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const ptosVenta = await FEParamGetPtosVenta(yamlData.cuit, userDir);
            const ptosVentaResponse = ptosVenta.FEParamGetPtosVentaResult;
            if (ptosVentaResponse.ResultGet) {
                responseText = 'Puntos de Venta:\n';
                ptosVentaResponse.ResultGet.PtoVenta.forEach((e: any) => {
                    responseText += 'Número: ' + e.Nro + ', Tipo de Emisión: ' + e.EmisionTipo + ', Bloqueado: ' + e.Bloqueado + '\n';
                });
            } else if (ptosVentaResponse.Errors) {
                responseText = 'Errores:\n';
                ptosVentaResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('tipos comprobante')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const tiposComprobante = await FEParamGetTiposCbte(yamlData.cuit, userDir);
            const tiposComprobanteResponse = tiposComprobante.FEParamGetTiposCbteResult;
            if (tiposComprobanteResponse.ResultGet) {
                responseText = 'Tipos de Comprobante:\n';
                tiposComprobanteResponse.ResultGet.CbteTipo.forEach((e: any) => {
                    responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
                });
            } else if (tiposComprobanteResponse.Errors) {
                responseText = 'Errores:\n';
                tiposComprobanteResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('tipos concepto')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const tiposConcepto = await FEParamGetTiposConcepto(yamlData.cuit, userDir);
            const tiposConceptoResponse = tiposConcepto.FEParamGetTiposConceptoResult;
            if (tiposConceptoResponse.ResultGet) {
                responseText = 'Tipos de Concepto:\n';
                tiposConceptoResponse.ResultGet.ConceptoTipo.forEach((e: any) => {
                    responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
                });
            } else if (tiposConceptoResponse.Errors) {
                responseText = 'Errores:\n';
                tiposConceptoResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('tipos documento')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const tiposDocumento = await FEParamGetTiposDoc(yamlData.cuit, userDir);
            const tiposDocumentoResponse = tiposDocumento.FEParamGetTiposDocResult;
            if (tiposDocumentoResponse.ResultGet) {
                responseText = 'Tipos de Documento:\n';
                tiposDocumentoResponse.ResultGet.DocTipo.forEach((e: any) => {
                    responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
                });
            } else if (tiposDocumentoResponse.Errors) {
                responseText = 'Errores:\n';
                tiposDocumentoResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('tipos iva')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const tiposIva = await FEParamGetTiposIva(yamlData.cuit, userDir);
            const tiposIvaResponse = tiposIva.FEParamGetTiposIvaResult;
            if (tiposIvaResponse.ResultGet) {
                responseText = 'Tipos de IVA:\n';
                tiposIvaResponse.ResultGet.IvaTipo.forEach((e: any) => {
                    responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
                });
            } else if (tiposIvaResponse.Errors) {
                responseText = 'Errores:\n';
                tiposIvaResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('tipos moneda')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const tiposMoneda = await FEParamGetTiposMonedas(yamlData.cuit, userDir);
            const tiposMonedaResponse = tiposMoneda.FEParamGetTiposMonedasResult;
            if (tiposMonedaResponse.ResultGet) {
                responseText = 'Tipos de Moneda:\n';
                tiposMonedaResponse.ResultGet.Moneda.forEach((e: any) => {
                    responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
                });
            } else if (tiposMonedaResponse.Errors) {
                responseText = 'Errores:\n';
                tiposMonedaResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('cotizacion')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            let cotizacionId = 'DOL';
            let cotizacionFecha = '';
            if (messageArray.length > 1) cotizacionId = messageArray[1].toUpperCase();
            if (messageArray.length > 2) cotizacionFecha = messageArray[2];
            const tiposCotizacion = await FEParamGetCotizacion(yamlData.cuit, userDir, cotizacionId, cotizacionFecha);
            const tiposCotizacionResponse = tiposCotizacion.FEParamGetCotizacionResult;
            if (tiposCotizacionResponse.ResultGet) {
                responseText = 'Cotización:\nID: ' + tiposCotizacionResponse.ResultGet.MonId + '\nCotiz: ' + tiposCotizacionResponse.ResultGet.MonCotiz + '\nFecha: ' + tiposCotizacionResponse.ResultGet.FchCotiz;
            } else if (tiposCotizacionResponse.Errors) {
                responseText = 'Errores:\n';
                tiposCotizacionResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('ultimo comprobante')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const ultimoComprobante = await FECompUltimoAutorizado(yamlData.cuit, userDir);
            const ultimoComprobanteResponse = ultimoComprobante.FECompUltimoAutorizadoResult;
            if (!ultimoComprobanteResponse.Errors) {
                responseText = JSON.stringify(ultimoComprobanteResponse);
            } else {
                responseText = 'Errores:\n';
                ultimoComprobanteResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('consultar comprobante')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            const consultarComprobante = await FECompConsultar(yamlData.cuit, userDir);
            const consultarComprobanteResponse = consultarComprobante.FECompConsultarResult;
            if (!consultarComprobanteResponse.Errors) {
                responseText = JSON.stringify(consultarComprobanteResponse);
            } else {
                responseText = 'Errores:\n';
                consultarComprobanteResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('facturar')) {
            if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
            if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
            if (messageArray.length < 8) throw new Error('Por favor enviá todos los parametros solicitados.');
            const dateCurrent = new Date();
            const currentYear = dateCurrent.getFullYear().toString();
            const currentMonth = (dateCurrent.getMonth() + 1).toString().padStart(2, '0');
            const currentDay = (dateCurrent.getDate()).toString().padStart(2, '0');
            const facturar = await FECAESolicitar(yamlData.cuit, userDir, {
                'FeCabReq': {
                    'CantReg': 1,
                    'PtoVta': messageArray[1],
                    'CbteTipo': messageArray[2]
                },
                'FeDetReq': {
                    'FECAEDetRequest': {
                        'Concepto': messageArray[3],
                        'DocTipo': messageArray[4],
                        'DocNro': messageArray[5],
                        'CbteDesde': 1,
                        'CbteHasta': 1,
                        'CbteFch': currentYear + currentMonth + currentDay,
                        'ImpTotal': messageArray[6],
                        'ImpTotConc': messageArray[6],
                        'ImpNeto': messageArray[6],
                        'ImpOpEx': messageArray[6],
                        'ImpIVA': messageArray[7],
                        'FchServDesde': '',
                        'FchServHasta': '',
                        'FchVtoPago': currentYear + currentMonth + currentDay,
                        'MonId': 'PES',
                        'MonCotiz': ''
                    }
                }
            });
            const facturarResponse = facturar.FECAESolicitarResult;
            if (!facturarResponse.Errors) {
                responseText = JSON.stringify(facturarResponse);
            } else {
                responseText = 'Errores:\n';
                facturarResponse.Errors.Err.forEach((e: any) => {
                    responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
                });
            }
        } else if (messageText.includes('ayuda')) {
            responseText = 'Comandos disponibles:\n' +
                '- configuracion [cuit|crt|key]: Configura los certificados\n' +
                '- puntos venta: Lista puntos de venta\n' +
                '- tipos comprobante: Tipos de comprobantes\n' +
                '- tipos concepto: Tipos de conceptos\n' +
                '- tipos documento: Tipos de documentos\n' +
                '- tipos iva: Alicuotas de IVA\n' +
                '- tipos moneda: Monedas disponibles\n' +
                '- cotizacion: Cotización de monedas\n' +
                '- ultimo comprobante [pto_venta] [tipo]: Último número\n' +
                '- consultar comprobante [pto_venta] [tipo] [numero]: Consulta uno\n' +
                '- facturar [pto_venta] [tipo] [concepto] [doc_tipo] [doc_nro] [importe] [iva]: Emite factura\n' +
                '- ayuda: Muestra esta ayuda';
        } else {
            throw new Error('Comando no reconocido. Envía "ayuda" para ver opciones.');
        }
    } catch (error: any) {
        responseText = error.message;
    }
    client.sendMessage(message.from, responseText);
    lastSentTimestamp = Date.now();
});

client.initialize();