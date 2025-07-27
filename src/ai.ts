import { loadHistory, saveHistory } from './history';

const callAi = async (options: any, message: string, username: string) => {
    try {
        const userHistory = loadHistory(username, options.historyFile);
        const messages = [{ role: 'system', content: options.instructions }];
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
        const data = await response.json();
        const responseText = data.choices[0].message.content || '';
        if (responseText === '') throw new Error('Respuesta no esperada del API');
        saveHistory(username, options.historyFile, message, responseText);
        return { error: false, message: responseText };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

const callAudio = async (options: any, media: any) => {
    try {
        const audioExtension: {[key: string]: string} = {
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'audio/wav': 'wav',
            'audio/webm': 'weba',
            'audio/aac': 'aac',
            'audio/midi': 'mid',
            'audio/x-wav': 'wav',
            'audio/x-aiff': 'aiff',
            'audio/x-m4a': 'm4a',
            'audio/x-ms-wma': 'wma',
            'audio/x-flac': 'flac',
            'audio/opus': 'opus',
            'audio/amr': 'amr',
            'audio/3gpp': '3gp',
            'audio/3gpp2': '3g2'
        };
        const response = await fetch(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + options.apiKey
            },
            body: JSON.stringify({
                model: options.model,
                reasoning_effort: options.reasoningEffort,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: options.audioInstructions },
                            {
                                type: 'input_audio',
                                input_audio: {
                                    data: media.data,
                                    format: audioExtension[media.mimetype.toLowerCase()] || ''
                                }
                            }
                        ]
                    }
                ],
                max_tokens: options.maxTokens
            })
        });
        if (!response.ok) throw new Error('Respuesta fallida del API');
        const data = await response.json();
        const responseText = data.choices[0].message.content || '';
        if (responseText === '') throw new Error('Respuesta no esperada del API');
        return { error: false, message: responseText };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

export { callAi, callAudio };