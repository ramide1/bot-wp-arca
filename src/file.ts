import { parse, stringify } from 'yaml';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const saveYaml = (yamlFile: string, jsonData: any) => {
    try {
        const fileDir = dirname(yamlFile);
        if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });
        const newYamlContent = stringify(jsonData);
        writeFileSync(yamlFile, newYamlContent, 'utf8');
        return true;
    } catch (error: any) {
        return false;
    }
};

const loadYaml = (yamlFile: string) => {
    try {
        if (!existsSync(yamlFile)) throw new Error('El archivo no existe');
        const fileContent = readFileSync(yamlFile, 'utf8');
        return parse(fileContent);
    } catch (error: any) {
        return false;
    }
};

const saveBase64 = (base64File: string, base64Data: string) => {
    try {
        const fileDir = dirname(base64File);
        if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });
        writeFileSync(base64File, base64Data, 'base64');
        return true;
    } catch (error: any) {
        return false;
    }
}

const saveHistory = (username: string, historyFile: string, message: string, response: string) => {
    let history: any = {};
    if (existsSync(historyFile)) {
        const fileContent = readFileSync(historyFile, 'utf8');
        history = parse(fileContent) || {};
    }

    history[username] = history[username] || [];
    history[username].push({ message, response });

    const newYamlContent = stringify(history);
    writeFileSync(historyFile, newYamlContent, 'utf8');
    return;
};

const loadHistory = (username: string, historyFile: string) => {
    if (existsSync(historyFile)) {
        const fileContent = readFileSync(historyFile, 'utf8');
        const history = parse(fileContent) || {};
        return history[username] || [];
    }
    return [];
};

export { saveYaml, loadYaml, saveBase64, saveHistory, loadHistory };