import { FEParamGetPtosVenta, FEParamGetTiposCbte, FEParamGetTiposConcepto, FEParamGetTiposDoc, FEParamGetTiposIva, FEParamGetTiposMonedas, FEParamGetCotizacion, FECompUltimoAutorizado, FECompConsultar, FECAESolicitar } from "./arca";
import { saveYaml, loadYaml, saveBase64, saveResponse } from './file';
import { callAi } from "./ai";

const configuracion = async (messageArray: any[], yamlFile: string, yamlData: any, userDir: string, message: any) => {
    try {
        if (messageArray.length < 2) throw new Error('Por favor enviá el parametro a configurar.');
        const parametro = messageArray[1];
        if (parametro == 'cuit') {
            if (messageArray.length < 3) throw new Error('No se detecto CUIT valido luego del parametro.');
            const cuit = messageArray[2];
            if (!saveYaml(yamlFile, { ...yamlData, ...{ cuit } })) throw new Error('Error al guardar los datos.');
            return 'CUIT ' + cuit + ' configurado correctamente.';
        } else if (parametro == 'crt') {
            if (!message.hasMedia) throw new Error('No se detecto archivo CRT adjunto en el mensaje.');
            const media = await message.downloadMedia();
            const base64File = userDir + 'ghf.crt';
            if (!saveBase64(base64File, media.data)) throw new Error('Error al guardar CRT.');
            if (!saveYaml(yamlFile, { ...yamlData, ...{ crt: true } })) throw new Error('Error al guardar los datos.');
            return 'CRT configurado correctamente.';
        } else if (parametro == 'key') {
            if (!message.hasMedia) throw new Error('No se detecto archivo KEY adjunto en el mensaje.');
            const media = await message.downloadMedia();
            const base64File = userDir + 'ghf.key';
            if (!saveBase64(base64File, media.data)) throw new Error('Error al guardar KEY.');
            if (!saveYaml(yamlFile, { ...yamlData, ...{ key: true } })) throw new Error('Error al guardar los datos.');
            return 'KEY configurado correctamente.';
        } else {
            throw new Error('No se detecto un parametro valido. Solo se acepta cuit, crt o key.');
        }
    } catch (error: any) {
        return error.message;
    }
};

const puntosVenta = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const ptosVenta = await FEParamGetPtosVenta(yamlData.cuit, userDir);
        const ptosVentaResponse = ptosVenta.FEParamGetPtosVentaResult;
        if (ptosVentaResponse.ResultGet) {
            let responseText = 'Puntos de Venta:\n';
            ptosVentaResponse.ResultGet.PtoVenta.forEach((e: any) => {
                responseText += 'Número: ' + e.Nro + ', Tipo de Emisión: ' + e.EmisionTipo + ', Bloqueado: ' + e.Bloqueado + '\n';
            });
            return responseText;
        } else if (ptosVentaResponse.Errors) {
            let responseText = 'Errores:\n';
            ptosVentaResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const tiposComprobante = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const tiposComprobante = await FEParamGetTiposCbte(yamlData.cuit, userDir);
        const tiposComprobanteResponse = tiposComprobante.FEParamGetTiposCbteResult;
        if (tiposComprobanteResponse.ResultGet) {
            let responseText = 'Tipos de Comprobante:\n';
            tiposComprobanteResponse.ResultGet.CbteTipo.forEach((e: any) => {
                responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
            });
            return responseText;
        } else if (tiposComprobanteResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposComprobanteResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const tiposConcepto = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const tiposConcepto = await FEParamGetTiposConcepto(yamlData.cuit, userDir);
        const tiposConceptoResponse = tiposConcepto.FEParamGetTiposConceptoResult;
        if (tiposConceptoResponse.ResultGet) {
            let responseText = 'Tipos de Concepto:\n';
            tiposConceptoResponse.ResultGet.ConceptoTipo.forEach((e: any) => {
                responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
            });
            return responseText;
        } else if (tiposConceptoResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposConceptoResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const tiposDocumento = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const tiposDocumento = await FEParamGetTiposDoc(yamlData.cuit, userDir);
        const tiposDocumentoResponse = tiposDocumento.FEParamGetTiposDocResult;
        if (tiposDocumentoResponse.ResultGet) {
            let responseText = 'Tipos de Documento:\n';
            tiposDocumentoResponse.ResultGet.DocTipo.forEach((e: any) => {
                responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
            });
            return responseText;
        } else if (tiposDocumentoResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposDocumentoResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const tiposIva = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const tiposIva = await FEParamGetTiposIva(yamlData.cuit, userDir);
        const tiposIvaResponse = tiposIva.FEParamGetTiposIvaResult;
        if (tiposIvaResponse.ResultGet) {
            let responseText = 'Tipos de IVA:\n';
            tiposIvaResponse.ResultGet.IvaTipo.forEach((e: any) => {
                responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
            });
            return responseText;
        } else if (tiposIvaResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposIvaResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const tiposMoneda = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const tiposMoneda = await FEParamGetTiposMonedas(yamlData.cuit, userDir);
        const tiposMonedaResponse = tiposMoneda.FEParamGetTiposMonedasResult;
        if (tiposMonedaResponse.ResultGet) {
            let responseText = 'Tipos de Moneda:\n';
            tiposMonedaResponse.ResultGet.Moneda.forEach((e: any) => {
                responseText += 'ID: ' + e.Id + ', Desc: ' + e.Desc + '\n';
            });
            return responseText;
        } else if (tiposMonedaResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposMonedaResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const cotizacion = async (messageArray: any[], yamlData: any, userDir: string) => {
    try {
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
            return 'Cotización:\nID: ' + tiposCotizacionResponse.ResultGet.MonId + '\nCotiz: ' + tiposCotizacionResponse.ResultGet.MonCotiz + '\nFecha: ' + tiposCotizacionResponse.ResultGet.FchCotiz;
        } else if (tiposCotizacionResponse.Errors) {
            let responseText = 'Errores:\n';
            tiposCotizacionResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const ultimoComprobante = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const ultimoComprobante = await FECompUltimoAutorizado(yamlData.cuit, userDir);
        const ultimoComprobanteResponse = ultimoComprobante.FECompUltimoAutorizadoResult;
        if (!ultimoComprobanteResponse.Errors) {
            return JSON.stringify(ultimoComprobanteResponse);
        } else {
            let responseText = 'Errores:\n';
            ultimoComprobanteResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const consultarComprobante = async (yamlData: any, userDir: string) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        const consultarComprobante = await FECompConsultar(yamlData.cuit, userDir);
        const consultarComprobanteResponse = consultarComprobante.FECompConsultarResult;
        if (!consultarComprobanteResponse.Errors) {
            return JSON.stringify(consultarComprobanteResponse);
        } else {
            let responseText = 'Errores:\n';
            consultarComprobanteResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const facturar = async (messageArray: any[], yamlData: any, userDir: string) => {
    try {
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
            return JSON.stringify(facturarResponse);
        } else {
            let responseText = 'Errores:\n';
            facturarResponse.Errors.Err.forEach((e: any) => {
                responseText += 'Código: ' + e.Code + ', Mensaje: ' + e.Msg + '\n';
            });
            return responseText;
        }
    } catch (error: any) {
        return error.message;
    }
};

const commandMessage = async (message: any, messageText: string, userDir: string, yamlFile: string, yamlData: any, messageArray: any[]) => {
    try {
        if (messageText.includes('configuracion')) {
            return await configuracion(messageArray, yamlFile, yamlData, userDir, message)
        } else if (messageText.includes('puntos venta')) {
            return await puntosVenta(yamlData, userDir);
        } else if (messageText.includes('tipos comprobante')) {
            return await tiposComprobante(yamlData, userDir);
        } else if (messageText.includes('tipos concepto')) {
            return await tiposConcepto(yamlData, userDir);
        } else if (messageText.includes('tipos documento')) {
            return await tiposDocumento(yamlData, userDir);
        } else if (messageText.includes('tipos iva')) {
            return await tiposIva(yamlData, userDir);
        } else if (messageText.includes('tipos moneda')) {
            return await tiposMoneda(yamlData, userDir);
        } else if (messageText.includes('cotizacion')) {
            return await cotizacion(messageArray, yamlData, userDir);
        } else if (messageText.includes('ultimo comprobante')) {
            return await ultimoComprobante(yamlData, userDir);
        } else if (messageText.includes('consultar comprobante')) {
            return await consultarComprobante(yamlData, userDir);
        } else if (messageText.includes('facturar')) {
            return await facturar(messageArray, yamlData, userDir);
        } else if (messageText.includes('ayuda')) {
            return 'Comandos disponibles:\n' +
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
            return false;
        }
    } catch (error: any) {
        return error.message;
    }
};

const processMessage = async (options: any, user: string, message: any) => {
    try {
        let responseText = 'Error al obtener respuesta. Intentá nuevamente más tarde.';
        const messageText = message.body.trim().toLowerCase();
        const userDir = options.webserviceDir + user + '/';
        const yamlFile = userDir + 'userdata.yml';
        const yamlData = loadYaml(yamlFile) || {};
        const messageArray = messageText.split(' ');
        responseText = await commandMessage(message, messageText, userDir, yamlFile, yamlData, messageArray);
        if (!responseText) {
            const aiResponse = await callAi(options, messageText, user);
            if (aiResponse && !aiResponse.error) {
                if (aiResponse.message.includes(options.commandPrefix)) {
                    const aiCommand = aiResponse.message.replace(options.commandPrefix, '').trim().toLowerCase();
                    const aiArray = aiCommand.split(' ');
                    responseText = await commandMessage(message, aiCommand, userDir, yamlFile, yamlData, aiArray);
                    saveResponse(user, options.historyFile, responseText);
                } else {
                    responseText = aiResponse.message;
                }
            }
        } else {
            saveResponse(user, options.historyFile, responseText);
        }
        return responseText;
    } catch (error: any) {
        return error.message;
    }
};

export { processMessage };