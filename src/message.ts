import { FEParamGetPtosVenta, FEParamGetTiposCbte, FEParamGetTiposConcepto, FEParamGetTiposDoc, FEParamGetTiposIva, FEParamGetTiposMonedas, FEParamGetCotizacion, FECompUltimoAutorizado, FECompConsultar, FECAESolicitar } from "./arca";
import { saveYaml, loadYaml, saveBase64, convertAudio } from './file';
import { saveHistory } from "./history";
import { callAi, callAudio } from "./ai";

const configuracion = async (messageArray: any[], yamlFile: string, yamlData: any, userDir: string, media: string = '') => {
    try {
        if (messageArray.length < 2) throw new Error('Por favor enviá el parametro a configurar.');
        const parametro = messageArray[1];
        if (parametro == 'cuit') {
            if (messageArray.length < 3) throw new Error('No se detecto CUIT valido luego del parametro.');
            const cuit = messageArray[2];
            if (!saveYaml(yamlFile, { ...yamlData, ...{ cuit } })) throw new Error('Error al guardar los datos.');
            return 'CUIT ' + cuit + ' configurado correctamente.';
        } else if (parametro == 'crt') {
            if (media === '') throw new Error('No se detecto archivo CRT adjunto en el mensaje.');
            const base64File = userDir + 'ghf.crt';
            if (!saveBase64(base64File, media)) throw new Error('Error al guardar CRT.');
            if (!saveYaml(yamlFile, { ...yamlData, ...{ crt: true } })) throw new Error('Error al guardar los datos.');
            return 'CRT configurado correctamente.';
        } else if (parametro == 'key') {
            if (media === '') throw new Error('No se detecto archivo KEY adjunto en el mensaje.');
            const base64File = userDir + 'ghf.key';
            if (!saveBase64(base64File, media)) throw new Error('Error al guardar KEY.');
            if (!saveYaml(yamlFile, { ...yamlData, ...{ key: true } })) throw new Error('Error al guardar los datos.');
            return 'KEY configurado correctamente.';
        } else {
            throw new Error('No se detecto un parametro valido. Solo se acepta cuit, crt o key.');
        }
    } catch (error: any) {
        return error.message;
    }
};

const puntosVenta = async (cuit: string, userDir: string) => {
    try {
        const ptosVenta = await FEParamGetPtosVenta(cuit, userDir);
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

const tiposComprobante = async (cuit: string, userDir: string) => {
    try {
        const tiposComprobante = await FEParamGetTiposCbte(cuit, userDir);
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

const tiposConcepto = async (cuit: string, userDir: string) => {
    try {
        const tiposConcepto = await FEParamGetTiposConcepto(cuit, userDir);
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

const tiposDocumento = async (cuit: string, userDir: string) => {
    try {
        const tiposDocumento = await FEParamGetTiposDoc(cuit, userDir);
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

const tiposIva = async (cuit: string, userDir: string) => {
    try {
        const tiposIva = await FEParamGetTiposIva(cuit, userDir);
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

const tiposMoneda = async (cuit: string, userDir: string) => {
    try {
        const tiposMoneda = await FEParamGetTiposMonedas(cuit, userDir);
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

const cotizacion = async (messageArray: any[], cuit: string, userDir: string) => {
    try {
        let cotizacionId = 'DOL';
        let cotizacionFecha = '';
        if (messageArray.length > 1) cotizacionId = messageArray[1].toUpperCase();
        if (messageArray.length > 2) cotizacionFecha = messageArray[2];
        const tiposCotizacion = await FEParamGetCotizacion(cuit, userDir, cotizacionId, cotizacionFecha);
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

const ultimoComprobante = async (cuit: string, userDir: string) => {
    try {
        const ultimoComprobante = await FECompUltimoAutorizado(cuit, userDir);
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

const consultarComprobante = async (cuit: string, userDir: string) => {
    try {
        const consultarComprobante = await FECompConsultar(cuit, userDir);
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

const facturar = async (messageArray: any[], cuit: string, userDir: string) => {
    try {
        if (messageArray.length < 8) throw new Error('Por favor enviá todos los parametros solicitados.');
        const dateCurrent = new Date();
        const currentYear = dateCurrent.getFullYear().toString();
        const currentMonth = (dateCurrent.getMonth() + 1).toString().padStart(2, '0');
        const currentDay = (dateCurrent.getDate()).toString().padStart(2, '0');
        const facturar = await FECAESolicitar(cuit, userDir, {
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

const checkCerts = (yamlData: any) => {
    try {
        if (!yamlData.cuit) throw new Error('No se encontró cuit valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.crt) throw new Error('No se encontró crt valido. Porfavor revisar el comando "configuracion".');
        if (!yamlData.key) throw new Error('No se encontró key valido. Porfavor revisar el comando "configuracion".');
        return { error: false, message: 'certificados validos.' };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

const commandMessage = async (messageText: string, userDir: string, yamlFile: string, yamlData: any, messageArray: any[], useDefaultWebservice: boolean = false, defaultWebserviceDir: string = '', defaultWebserviceCuit: string = '', media: string = '') => {
    try {
        if (messageText.includes('configuracion')) {
            return await configuracion(messageArray, yamlFile, yamlData, userDir, media)
        } else if (messageText.includes('puntos venta')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) throw new Error(certsValid.message);
            return await puntosVenta(yamlData.cuit, userDir);
        } else if (messageText.includes('tipos comprobante')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await tiposComprobante(defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await tiposComprobante(yamlData.cuit, userDir);
        } else if (messageText.includes('tipos concepto')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await tiposConcepto(defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await tiposConcepto(yamlData.cuit, userDir);
        } else if (messageText.includes('tipos documento')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await tiposDocumento(defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await tiposDocumento(yamlData.cuit, userDir);
        } else if (messageText.includes('tipos iva')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await tiposIva(defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await tiposIva(yamlData.cuit, userDir);
        } else if (messageText.includes('tipos moneda')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await tiposMoneda(defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await tiposMoneda(yamlData.cuit, userDir);
        } else if (messageText.includes('cotizacion')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) {
                if (useDefaultWebservice && (defaultWebserviceDir != '') && (defaultWebserviceCuit != '')) return await cotizacion(messageArray, defaultWebserviceCuit, defaultWebserviceDir);
                throw new Error(certsValid.message);
            }
            return await cotizacion(messageArray, yamlData.cuit, userDir);
        } else if (messageText.includes('ultimo comprobante')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) throw new Error(certsValid.message);
            return await ultimoComprobante(yamlData.cuit, userDir);
        } else if (messageText.includes('consultar comprobante')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) throw new Error(certsValid.message);
            return await consultarComprobante(yamlData.cuit, userDir);
        } else if (messageText.includes('facturar')) {
            const certsValid = checkCerts(yamlData);
            if (certsValid.error) throw new Error(certsValid.message);
            return await facturar(messageArray, yamlData.cuit, userDir);
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
        let messageText = message.body.trim().toLowerCase();
        const userDir = options.webserviceDir + user + '/';
        const yamlFile = userDir + 'userdata.yml';
        const yamlData = loadYaml(yamlFile) || {};
        const media = message.hasMedia ? await message.downloadMedia() : false;
        if ((messageText === '') && options.audio && media && media.mimetype.startsWith('audio/ogg')) {
            const audioData = convertAudio(userDir + 'tmp.ogg', media.data, 'wav');
            if (!audioData) throw new Error('Error al obtener audio.');
            const audioResponse = await callAudio(options, audioData, 'wav');
            if (audioResponse && !audioResponse.error) messageText = audioResponse.message;
        }
        const messageArray = messageText.split(' ');
        responseText = await commandMessage(messageText, userDir, yamlFile, yamlData, messageArray, options.useDefaultWebservice, options.defaultWebserviceDir, options.defaultWebserviceCuit, media ? media.data : '');
        if (options.useAi) {
            if (!responseText) {
                const aiResponse = await callAi(options, messageText, user);
                if (aiResponse && !aiResponse.error) {
                    if (aiResponse.message.includes(options.commandPrefix)) {
                        const aiResponseArray = aiResponse.message.split(options.commandPrefix);
                        const aiCommand = aiResponseArray[aiResponseArray.length - 1].trim().toLowerCase();
                        const aiArray = aiCommand.split(' ');
                        responseText = await commandMessage(aiCommand, userDir, yamlFile, yamlData, aiArray, options.useDefaultWebservice, options.defaultWebserviceDir, options.defaultWebserviceCuit, media ? media.data : '');
                        saveHistory(user, options.historyFile, 'Respuesta devuelta por Arca: \n' + responseText, 'Respuesta confirmada.');
                        if (!saveYaml(yamlFile, { ...yamlData, ...{ messagecount: (yamlData.messagecount ? yamlData.messagecount : 0) + 1, lastmessage: Date.now() } })) throw new Error('Error al guardar los datos.');
                    } else {
                        responseText = aiResponse.message;
                    }
                }
            } else {
                saveHistory(user, options.historyFile, messageText, responseText);
            }
        } else {
            if (!responseText) throw new Error('Comando no reconocido. Envía "ayuda" para ver opciones.');
        }
        return responseText;
    } catch (error: any) {
        return error.message;
    }
};

export { processMessage };