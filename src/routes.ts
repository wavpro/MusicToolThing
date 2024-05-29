import { Elysia, t } from 'elysia'
import type { Database } from "bun:sqlite";
import initAuth, { isLoggedIn } from './accounts/auth';
import jwt from '@elysiajs/jwt';
import saveTrack from './processing/save_track';
import { error } from './response/error';
import type { track, user } from '../data/database.sqlite.ts';
import { response } from './response/response.ts';

const displayTracksPerLoad = 50;

export default function router(db: Database) {
    const getTrackQuery = db.query("SELECT * FROM tracks WHERE id = $id;");
    const getTracksByUploaderQuery = db.query(`SELECT * FROM tracks WHERE uploaded_by = $uploader_id LIMIT ${displayTracksPerLoad} OFFSET $offset`)

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
                .guard(
                    {
                        params: t.Object({
                            id: t.Numeric()
                        })
                    },
                    (app) => app
                        .get('/tracks/:id/audio', ({ params: { id } }) => {
                            return Bun.file(`data/tracks/${id}/audio.ogg`);
                        })
                        .get('/tracks/:id/info', async ({ params: { id } }) => {
                            const track = await getTrackQuery.get({ $id: id });

                            if (!track) {
                                return error("validation", "params", "id", "Track doesn't exist");
                            }

                            return response("", track);
                        })
                )
                .guard(
                    {
                        params: t.Object({
                            id: t.Numeric(),
                        }),
                        query: t.Object({
                            size: t.Union([
                                t.Literal("1000"),
                                t.Literal("512"),
                                t.Literal("128"),
                                t.Literal("64")
                            ])
                        })
                    },
                    (app) => app
                        .get('/tracks/:id/cover', async ({ params: { id }, query: { size } }) => {
                            if (size === "1000") {
                                return Bun.file(`data/tracks/${id}/cover.png`);
                            }

                            return Bun.file(`data/tracks/${id}/cover_${size}.png`);
                        })
                )
                .guard({
                    params: t.Object({
                        id: t.Numeric(),
                    }),
                    query: t.Object({
                        p: t.Optional(t.Union([
                            t.String(),
                            t.Number()
                        ]))
                    })
                }, (app) => app
                    .get('/tracks/uploaded-by/:id', async ({ params: { id }, query: { p } }) => {
                        if (!p) {
                            p = 0
                        }

                        if (typeof p === 'string') {
                            p = parseInt(p)
                        }

                        let tracks = (getTracksByUploaderQuery.all({
                            $uploader_id: id,
                            $offset: p*displayTracksPerLoad
                        }) as track | track[] | null) || []

                        if (!Array.isArray(tracks)) {
                            tracks = [tracks]
                        }

                        return response(`Found ${tracks.length}`, tracks)
                    }))
                .get('/upload', Bun.file('src/html/upload_example.html'))
                .guard(
                    {
                        body: t.Object({
                            title: t.String(),
                            artist: t.String(),
                            cover: t.Optional(
                                t.File({
                                    type: ["image/jpeg", "image/png"]
                                })
                            ),
                            track: t.File({
                                type: ["audio/x-flac", "audio/flac", "audio/x-wav", "audio/wav", "audio/mpeg", "audio/ogg", "audio/opus"]
                            })
                        })
                    },
                    (app) => app.post('/tracks/upload', async ({ body, jwt: { verify }, cookie: { auth } }) => {
                        return await saveTrack(body.title, body.artist, body.track, body.cover || null, db, await verify(auth.value) as user);
                    })
                )
        )
        .get('/sign-in', Bun.file('src/html/login_example.html'))
        .use(initAuth(db))
        .listen(3000);
}