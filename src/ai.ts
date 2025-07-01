import { loadHistory, saveHistory } from './file';

const callAi = async (options: any, message: string, username: string) => {
    const userHistory = loadHistory(username, options.historyFile);
    const messages = [
        { role: options.googleApi ? 'user' : 'system', content: options.instructions }
    ];

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
        if (!response.ok) {
            return { error: true, message: 'API request failed' };
        }
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
        if (!response.ok) {
            return { error: true, message: 'API request failed' };
        }
        const data = await response.json();
        responseText = data.choices[0].message.content || '';
    }
    if (responseText !== '') {
        saveHistory(username, options.historyFile, message, responseText);
        return { error: false, message: responseText };
    }
    return { error: true, message: 'API request failed' };
};

export { callAi };