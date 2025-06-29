import { readFileSync, writeFileSync, unlinkSync, existsSync, statSync } from 'fs';
import { createClientAsync } from 'soap';
import { create, convert } from 'xmlbuilder2';
import { execSync } from 'child_process';
import 'dotenv/config';

const webservice = {
    'wsaa': {
        'cert': 'ghf.crt',
        'privatekey': 'ghf.key',
        'password': '',
        'prod': 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
        'test': 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
    },
    'wsfe': {
        'prod': 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
        'test': 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
    },
    'test': (process.env.TESTMODE !== undefined) ? process.env.TESTMODE : 'true',
    'maxattempts': parseInt((process.env.MAXATTEMPTS !== undefined) ? process.env.MAXATTEMPTS : '3')
};

const functionAttempts = async (functionAttempt: any) => {
    const maxAttempts = webservice.maxattempts;
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            return await functionAttempt();
        } catch (error: any) {
            attempts++;
            if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    return false;
};

const checkWsdl = (wsdlFile: string) => {
    try {
        if (!existsSync(wsdlFile)) throw new Error('Wsdl file not found');
        const stats = statSync(wsdlFile);
        const fileDate = stats.mtime;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return fileDate < oneYearAgo;
    } catch (error: any) {
        return false;
    }
};

const downloadWsdl = async (wsdlFile: string, wsdlUrl: string) => {
    return await functionAttempts(async () => {
        const response = await fetch(wsdlUrl, { method: 'GET' });
        if (!response.ok) throw new Error('Response was not ok');
        const file = Buffer.from(await response.arrayBuffer());
        writeFileSync(wsdlFile, file);
        return true;
    });
};

const createTra = (service: string, currentDir: string, currentEnviroment: string) => {
    try {
        const currentTime = Math.floor(Date.now() / 1000);
        const generationTime = new Date((currentTime - 60) * 1000).toISOString();
        const expirationTime = new Date((currentTime + 60) * 1000).toISOString();
        const doc = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('loginTicketRequest', { version: '1.0' })
            .ele('header')
            .ele('uniqueId').txt(currentTime.toString()).up()
            .ele('generationTime').txt(generationTime).up()
            .ele('expirationTime').txt(expirationTime).up()
            .up()
            .ele('service').txt(service).up()
            .up();
        writeFileSync(currentDir + 'TRA_' + service + '_' + currentEnviroment + '.xml', doc.end({ prettyPrint: true }));
        return true;
    } catch (error: any) {
        return false;
    }
};

const signTra = (service: string, currentDir: string, currentEnviroment: string) => {
    try {
        const inputFile = currentDir + 'TRA_' + service + '_' + currentEnviroment + '.xml';
        const outputFile = currentDir + 'TRA_' + service + '_' + currentEnviroment + '.tmp';
        const certFile = currentDir + webservice.wsaa.cert;
        const keyFile = currentDir + webservice.wsaa.privatekey;
        const password = webservice.wsaa.password;
        if (!existsSync(inputFile)) throw new Error('Input file not found');
        if (!existsSync(certFile)) throw new Error('Certificate file not found');
        if (!existsSync(keyFile)) throw new Error('Private key file not found');
        execSync('openssl cms -sign -in ' + inputFile + ' -out ' + outputFile + ' -signer ' + certFile + ' -inkey ' + keyFile + ' -nodetach -outform DER -nosmimecap' + ((password != '') ? (' -passin pass:' + password) : ''));
        const cms = readFileSync(outputFile, 'base64');
        unlinkSync(outputFile);
        return cms;
    } catch (error: any) {
        return false;
    }
};

const getSoapClient = async (service: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const currentEnviroment = (webservice.test == 'false') ? 'prod' : 'test';
        const serviceConfig = webservice[service as keyof typeof webservice];
        const wsdlFile = currentDir + service + '_' + currentEnviroment + '.wsdl';
        if (!checkWsdl(wsdlFile) && !(await downloadWsdl(wsdlFile, serviceConfig[currentEnviroment as keyof typeof serviceConfig] + '?wsdl'))) throw new Error('Error downloading wsdl');
        const client = await createClientAsync(wsdlFile);
        return client;
    });
};

const callWsaa = async (cms: any, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsaa';
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.loginCmsAsync({ in0: cms });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const getTa = async (service: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const currentEnviroment = (webservice.test == 'false') ? 'prod' : 'test';
        const taFile = currentDir + 'TA_' + service + '_' + currentEnviroment + '.xml';
        if (existsSync(taFile)) {
            const taObject = convert(readFileSync(taFile, 'utf8'), { format: 'object' }) as any;
            if ((new Date(taObject.loginTicketResponse.header.expirationTime)) > (new Date())) return taObject;
        }
        if (!createTra(service, currentDir, currentEnviroment)) throw new Error('Error creating TRA');
        const cms = signTra(service, currentDir, currentEnviroment);
        if (!cms) throw new Error('Error signing TRA');
        const ta = (await callWsaa(cms, currentDir)).loginCmsReturn;
        if (!ta) throw new Error('Error calling WSAA');
        writeFileSync(taFile, ta);
        return convert(ta, { format: 'object' }) as any;
    });
};

const FEParamGetPtosVenta = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetPtosVentaAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposCbte = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposCbteAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposConcepto = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposConceptoAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposDoc = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposDocAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposIva = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposIvaAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposMonedas = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposMonedasAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposOpcional = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposOpcionalAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetTiposTributos = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FEParamGetTiposTributosAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FEParamGetCotizacion = async (cuit: string, currentDir: string, monId: string = 'DOL', currentDate: string = '') => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const dateCurrent = (currentDate != '') ? (new Date(currentDate)) : (new Date());
        const currentYear = dateCurrent.getFullYear().toString();
        const currentMonth = (dateCurrent.getMonth() + 1).toString().padStart(2, '0');
        const currentDay = (dateCurrent.getDate()).toString().padStart(2, '0');
        const result = await client.FEParamGetCotizacionAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            },
            'MonId': monId,
            'FchCotiz': currentYear + currentMonth + currentDay
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FECompUltimoAutorizado = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FECompUltimoAutorizadoAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FECompConsultar = async (cuit: string, currentDir: string) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FECompConsultarAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            }
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

const FECAESolicitar = async (cuit: string, currentDir: string, options: any) => {
    return await functionAttempts(async () => {
        const service = 'wsfe';
        const ta = await getTa(service, currentDir);
        if (!ta) throw new Error('Error getting TA');
        const client = await getSoapClient(service, currentDir);
        if (!client) throw new Error('Error creating ' + service + ' client');
        const result = await client.FECAESolicitarAsync({
            'Auth': {
                'Token': ta.loginTicketResponse.credentials.token,
                'Sign': ta.loginTicketResponse.credentials.sign,
                'Cuit': cuit
            },
            'FeCAEReq': options
        });
        if (result[0].faultcode) throw new Error('SOAP Fault: ' + result[0].faultcode + ' ' + result[0].faultstring);
        return result[0];
    });
};

export { FEParamGetPtosVenta, FEParamGetTiposCbte, FEParamGetTiposConcepto, FEParamGetTiposDoc, FEParamGetTiposIva, FEParamGetTiposMonedas, FEParamGetTiposOpcional, FEParamGetTiposTributos, FEParamGetCotizacion, FECompUltimoAutorizado, FECompConsultar, FECAESolicitar };