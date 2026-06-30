import { Database } from "bun:sqlite";

interface UserData {
    user: string;
    cuit?: string;
    crt?: boolean;
    key?: boolean;
    messagecount?: number;
    lastmessage?: number;
}

const connections: Map<string, Database> = new Map<string, Database>();
const appSqliteDatabase: string = process.env.APP_SQLITE_DATABASE ?? 'data/db.sqlite';

const getDb = () => {
    if (!connections.has(appSqliteDatabase)) {
        const db: Database = new Database(appSqliteDatabase, { create: true });
        db.run('CREATE TABLE IF NOT EXISTS chat_history (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, role TEXT NOT NULL, text_content TEXT, tool_call_id TEXT, function_name TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user)');
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp)');
        db.run('CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT NOT NULL UNIQUE, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_uuid ON sessions(uuid)');
        db.run('CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp)');
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL UNIQUE, cuit TEXT, crt INTEGER DEFAULT 0, key INTEGER DEFAULT 0, messagecount INTEGER DEFAULT 0, lastmessage INTEGER DEFAULT 0, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_user ON users(user)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_timestamp ON users(timestamp)');
        connections.set(appSqliteDatabase, db);
        return db;
    }
    return connections.get(appSqliteDatabase)!;
}

const saveHistory = (user: string, role: string, textContent: string, toolCallId: string, functionName: string) => {
    const db: Database = getDb();
    const query: any = db.query('INSERT INTO chat_history (user, role, text_content, tool_call_id, function_name) VALUES (?, ?, ?, ?, ?)');
    try {
        query.run(user, role, textContent, toolCallId, functionName);
        return true;
    } catch (error: any) {
        return false;
    }
};

const loadHistory = (user: string) => {
    const db: Database = getDb();
    const query: any = db.query('SELECT * FROM chat_history WHERE user = ?');
    return query.all(user) ?? [];
};

const resetHistory = (user: string) => {
    const db: Database = getDb();
    const query: any = db.query('DELETE FROM chat_history WHERE user = ?');
    const result: any = query.run(user);
    return result.changes > 0;
};

const resetAllHistory = () => {
    const db: Database = getDb();
    const query: any = db.query('DELETE FROM chat_history');
    const result: any = query.run();
    const queryIds: any = db.query('DELETE FROM sqlite_sequence WHERE name = "chat_history"');
    queryIds.run()
    return result.changes > 0;
};

const createSession = (uuid: string) => {
    const db: Database = getDb();
    const query: any = db.query('INSERT INTO sessions (uuid) VALUES (?)');
    try {
        query.run(uuid);
        return true;
    } catch (error: any) {
        return false;
    }
};

const getSession = (uuid: string) => {
    const db: Database = getDb();
    const query: any = db.query('SELECT * FROM sessions WHERE uuid = ?');
    return query.get(uuid) ?? null;
};

const getSessions = () => {
    const db: Database = getDb();
    const query: any = db.query('SELECT * FROM sessions');
    return query.all() ?? [];
};

const deleteSession = (uuid: string) => {
    const db: Database = getDb();
    const query: any = db.query('DELETE FROM sessions WHERE uuid = ?');
    const result: any = query.run(uuid);
    return result.changes > 0;
};

const deleteAllSessions = () => {
    const db: Database = getDb();
    const query: any = db.query('DELETE FROM sessions');
    const result: any = query.run();
    const queryIds: any = db.query('DELETE FROM sqlite_sequence WHERE name = "sessions"');
    queryIds.run()
    return result.changes > 0;
};

const getUser = (user: string) => {
    const db: Database = getDb();
    const query: any = db.query('SELECT * FROM users WHERE user = ?');
    return query.get(user) ?? null;
};

const saveUser = (options: UserData) => {
    const db: Database = getDb();
    const previousValues: any = getUser(options.user);
    try {
        if (previousValues) {
            const query: any = db.query('UPDATE users SET user = ?, cuit = ?, crt = ?, key = ?, messagecount = ?, lastmessage = ? WHERE user = ?');
            query.run(options.user ?? previousValues.user, options.cuit ?? previousValues.cuit, (options.crt !== undefined) ? (options.crt ? 1 : 0) : (previousValues.crt ? 1 : 0), (options.key !== undefined) ? (options.key ? 1 : 0) : (previousValues.key ? 1 : 0), options.messagecount ?? previousValues.messagecount, options.lastmessage ?? previousValues.lastmessage, previousValues.user);
        } else {
            const query: any = db.query('INSERT INTO users (user, cuit, crt, key, messagecount, lastmessage) VALUES (?, ?, ?, ?, ?, ?)');
            query.run(options.user ?? '', options.cuit ?? '', (options.crt !== undefined) ? (options.crt ? 1 : 0) : 0, (options.key !== undefined) ? (options.key ? 1 : 0) : 0, options.messagecount ?? 0, options.lastmessage ?? 0);
        }
        return true;
    } catch (error: any) {
        return false;
    }
};

export { saveHistory, loadHistory, resetHistory, resetAllHistory, createSession, getSession, getSessions, deleteSession, deleteAllSessions, getUser, saveUser };