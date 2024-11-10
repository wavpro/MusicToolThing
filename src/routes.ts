import { Elysia, t } from 'elysia'
import initAuth, { isLoggedIn } from './accounts/auth';
import jwt from '@elysiajs/jwt';
import saveTrack from './processing/save_track';
import { error } from './response/error';
import type { track, user } from '../data/database.sqlite.ts';
import { response } from './response/response.ts';
import { db } from '../data/db.ts';
import { log } from './logging/index.ts';
import { getChunkOfFile } from './streaming/chunking_handler.ts';

const displayTracksPerLoad = 50;

export enum AudioQualities {
    Opus = "0",
    FLAC = "1",
    WAVE = "2",
    MPEG = "3",
    AAC = "4"
}

const getTrackQuery = db.query("SELECT * FROM tracks WHERE id = $id;");
const getTracksByUploaderQuery = db.query(`SELECT * FROM tracks WHERE uploaded_by = $uploader_id LIMIT ${displayTracksPerLoad} OFFSET $offset`)

export default function router() {
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
                .get('player', Bun.file('src/html/player.html'))
                .guard(
                    {
                        params: t.Object({
                            id: t.Numeric()
                        })
                    },
                    (app) => app
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
                            id: t.Numeric()
                        }),
                        query: t.Object({
                            quality: t.Enum(AudioQualities)
                        })
                    },
                    (app) => app
                        .get('/tracks/:id/audio', async ({ params: { id }, query: { quality }, headers, set }) => {
                            const track = await getTrackQuery.get({ $id: id }) as track | null;

                            if (!track) {
                                return error("validation", "params", "id", "Track doesn't exist");
                            }

                            let path: string;

                            switch (quality) {
                                case AudioQualities.AAC:
                                    if (track.s_m4a) {
                                        path = `data/tracks/${id}/audio.m4a`
                                    } else {
                                        return error("validation", "query", "quality", "Selected quality doesn't exist on track");
                                    }
                                    break;
                                case AudioQualities.FLAC:
                                    if (track.s_flac) {
                                        path = `data/tracks/${id}/audio.flac`
                                    } else {
                                        return error("validation", "query", "quality", "Selected quality doesn't exist on track");
                                    }
                                    break;
                                case AudioQualities.MPEG:
                                    if (track.s_mp3) {
                                        path = `data/tracks/${id}/audio.mp3`
                                    } else {
                                        return error("validation", "query", "quality", "Selected quality doesn't exist on track");
                                    }
                                    break;
                                case AudioQualities.Opus:
                                    if (track.s_ogg) {
                                        path = `data/tracks/${id}/audio.ogg`
                                    } else {
                                        return error("validation", "query", "quality", "Selected quality doesn't exist on track");
                                    }
                                    break;
                                case AudioQualities.WAVE:
                                    if (track.s_wav) {
                                        path = `data/tracks/${id}/audio.wav`
                                    } else {
                                        return error("validation", "query", "quality", "Selected quality doesn't exist on track");
                                    }
                                    break;
                                // Won't happen since elysia validation
                                default:
                                    log('Uh oh this shouldn\'t have happened #3593')
                                    path = '';
                            }

                            const [response, rHeaders, status] = await getChunkOfFile(path, headers, quality);

                            for (let header in rHeaders) {
                                set.headers[header] = rHeaders[header];
                            }

                            console.log(set.headers);
                            
                            set.status = status;

                            return response;
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
                            $offset: p * displayTracksPerLoad
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
                        return await saveTrack(body.title, body.artist, body.track, body.cover || null, await verify(auth.value) as user);
                    })
                )
        )
        .get('/sign-in', Bun.file('src/html/login_example.html'))
        .use(initAuth(db))
        .listen(3000);
}