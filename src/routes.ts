import { Cookie, Elysia, t } from 'elysia'
import type { Database } from "bun:sqlite";
import format from './processing/formats';
import initAuth, { type authCookie, isLoggedIn } from './accounts/auth';
import jwt from '@elysiajs/jwt';
import saveTrack from './processing/save_track';
import { error } from './response/error';
import type { user } from '../data/database.sqlite.ts';
import { response } from './response/response.ts';

export default function router(db: Database) {
    const getTrackQuery = db.query("SELECT * FROM tracks WHERE id = $id;");

    new Elysia()
        .use(
            jwt({
                name: 'jwt',
                secret: process.env.secret || ""
            })
        )
        .guard(
            {
                //@ts-ignore
                beforeHandle: isLoggedIn
            }, (app) => app
                .get('/tracks/:id/audio', ({ params: { id } }) => {
                    if (!/^\d+$/.test(id)) {
                        return error("validation", "params", "id", "Invalid track id");
                    }

                    return Bun.file(`data/tracks/${id}/audio.ogg`);
                })
                .get('/tracks/:id/info', async ({ params: { id } }) => {
                    if (!/^\d+$/.test(id)) {
                        return error("validation", "params", "id", "Invalid track id");
                    }

                    const track = await getTrackQuery.get({ $id: id });

                    if (!track) {
                        return error("validation", "params", "id", "Track doesn't exist");
                    }

                    return response("", track);
                })
                .guard(
                    {
                        body: t.Object({
                            title: t.String(),
                            artist: t.String(),
                            cover: t.File(),
                            track: t.File()
                        })
                    },
                    (app) => app.post('/tracks/upload', async ({ body, jwt: { verify }, cookie: { auth } }) => {
                        if (body.track.type !== "audio/x-flac" && body.track.type !== "audio/mpeg" && body.track.type !== "audio/ogg" && body.track.type !== "audio/opus" && body.track.type !== "audio/wav") {
                            return error("validation", "body", "/track", "Invalid file format");
                        }

                        if (body.cover.type !== "image/jpeg" && body.cover.type !== "image/png") {
                            return error("validation", "body", "/cover", "Invalid file format");
                        }

                        return await saveTrack(body.title, body.artist, body.track, body.cover, db, await verify(auth.value) as user);
                    })
                )
        )
        .get('/sign-in', Bun.file('src/html/login_example.html'))
        .get('/upload', Bun.file('src/html/upload_example.html'))
        .use(initAuth(db))
        .listen(3000);
}