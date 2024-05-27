import { Elysia } from 'elysia'
import type { Database } from "bun:sqlite";
import format from './processing/formats';
import initAuth from './accounts/auth';

export default function router(db: Database) {
    new Elysia()
        .get('/tracks/:id', ({ params: { id } }) => {
            if (!/^\d+$/.test(id)) {
                return "Invalid track id"
            }
            format(id);
            return Bun.file(`data/tracks/${id}/audio.m4a`);
        })
        .get('/sign-in', Bun.file('src/html/login_example.html'))
        .use(initAuth(db))
        .listen(3000);
}