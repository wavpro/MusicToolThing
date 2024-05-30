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
            s_mp3 integer DEFAULT 0,
            s_ogg integer DEFAULT 0,
            s_flac integer DEFAULT 0,
            s_wav integer DEFAULT 0,
            s_m4a integer DEFAULT 0,
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
    s_mp3: boolean;
    s_ogg: boolean;
    s_flac: boolean;
    s_wav: boolean;
    s_m4a: boolean;
}