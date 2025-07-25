import { loadHistory, saveHistory } from './history';

const callAi = async (options: any, message: string, username: string) => {
    try {
        const userHistory = loadHistory(username, options.historyFile);
        const messages = [{ role: options.googleApi ? 'user' : 'system', content: options.instructions }];
        userHistory.forEach((entry: any) => {
            messages.push({ role: 'user', content: entry.message });
            messages.push({ role: options.googleApi ? 'model' : 'assistant', content: entry.response });
        });
        messages.push({ role: 'user', content: message });
        let responseText = '';
        if (options.googleApi) {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + options.model + ':generateContent?key=' + options.apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: messages.map(msg => (
                        {
                            role: msg.role,
                            parts: [
                                {
                                    text: msg.content
                                }
                            ]
                        }
                    )),
                    generationConfig: {
                        maxOutputTokens: options.maxTokens
                    }
                })
            });
            if (!response.ok) throw new Error('Respuesta fallida del API');
            const data = await response.json();
            responseText = data.candidates[0].content.parts[0].text || '';
        } else {
            const response = await fetch(options.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + options.apiKey
                },
                body: JSON.stringify({
                    model: options.model,
                    messages,
                    max_tokens: options.maxTokens
                })
            });
            if (!response.ok) throw new Error('Respuesta fallida del API');
            const data = await response.json();
            responseText = data.choices[0].message.content || '';
        }
        if (responseText === '') throw new Error('Respuesta no esperada del API');
        saveHistory(username, options.historyFile, message, responseText);
        return { error: false, message: responseText };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

const callGoogleAudio = async (options: any, media: any) => {
    try {
        let responseText = '';
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + options.model + ':generateContent?key=' + options.apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: options.audioInstructions },
                            {
                                inlineData: {
                                    mimeType: media.mimetype,
                                    data: media.data
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: options.maxTokens
                }
            })
        });
        if (!response.ok) throw new Error('Respuesta fallida del API');
        const data = await response.json();
        responseText = data.candidates[0].content.parts[0].text || '';
        if (responseText === '') throw new Error('Respuesta no esperada del API');
        return { error: false, message: responseText };
    } catch (error: any) {
        return { error: true, message: error.message };
    }
};

export { callAi, callGoogleAudio };