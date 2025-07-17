import { parse, stringify } from 'yaml';
import { readFileSync, existsSync, writeFileSync } from 'fs';

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

export { saveHistory, loadHistory };