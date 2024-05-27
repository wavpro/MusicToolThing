import type { Database } from "bun:sqlite";
import fs from "fs";

export default function setup(db: Database) {
    if (!fs.existsSync("./tracks")) {
        fs.mkdirSync("./tracks");
    }
    try {
        db.prepare(`SELECT * FROM users LIMIT 1;`).run();
    } catch (e) {
        db.prepare(`CREATE TABLE users (
            id integer AUTO_INCREMENT PRIMARY KEY,
            username text NOT NULL UNIQUE,
            password text NOT NULL
        );`).run();
        db.prepare(`CREATE TABLE sessions (
            id TEXT NOT NULL PRIMARY KEY,
            expires_at INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user(id)
        );`).run();
        db.prepare(`CREATE TABLE tracks (
            id integer AUTO_INCREMENT PRIMARY KEY,
            title text NOT NULL,
            uploaded_by integer NOT NULL,
            FOREIGN KEY (uploaded_by) REFERENCES \`users\`(\`id\`)
        );`).run();
    }
}

export type user = {
    id: number;
    username: string;
    password: string;
}