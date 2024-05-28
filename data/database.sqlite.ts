import type { Database } from "bun:sqlite";
import fs from "fs";

export default function setup(db: Database) {
    if (!fs.existsSync("./data/tracks")) {
        fs.mkdirSync("./data/tracks");
        fs.mkdirSync("./data/tracks/tmp");
    }
    try {
        db.prepare(`SELECT * FROM users LIMIT 1;`).run();
    } catch (e) {
        db.prepare(`CREATE TABLE users (
            id integer PRIMARY KEY AUTOINCREMENT,
            username text NOT NULL UNIQUE,
            password text NOT NULL
        );`).run();
        db.prepare(`CREATE TABLE tracks (
            id integer PRIMARY KEY AUTOINCREMENT,
            title text NOT NULL,
            artist text NOT NULL,
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
export type track = {
    id: number;
    title: string;
    artist: string;
    uploaded_by: number;
}