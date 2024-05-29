import { error, type ErrorResponse } from "../response/error";
import { response, type Success } from "../response/response";
import type { Database } from "bun:sqlite";
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import type { track, user } from "../../data/database.sqlite.ts";
import format from "./formats.ts";
import { log } from "../logging/index.ts";
import processCover from "./cover.ts";

function isSupportedCodec(codec: string): boolean {
    switch (codec) {
        case 'libopus':
            return true;
        case 'flac':
            return true;
        case 'aac':
            return true;
        case 'libmp3lame':
            return true;
        case 'mp3 (mp3float)':
            return true;
        default:
            return false;
    }
}
function getCoverArtFileExtension(file: File): string {
    switch(file.type) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        default:
            return 'unknown';
    }
}
function uuidv4(): string {
    // @ts-ignore  
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export default function saveTrack(title: string, artist: string, audioFile: File, coverFile: File | null, db: Database, user: user): Promise<ErrorResponse | Success> {
    return new Promise<ErrorResponse | Success>(async (resolve, reject) => {
        const tmpUUID = uuidv4();
        const fileExtension = audioFile.name.match(/\.[^/.]+$/);
        const tmpPath = `./data/tracks/tmp/${tmpUUID}${fileExtension}`;
        const tmpPath2 = `./data/tracks/tmp/${tmpUUID}_2${fileExtension}`;

        fs.writeFileSync(tmpPath, new Int8Array(await audioFile.arrayBuffer()));
        fs.writeFileSync(tmpPath2, '');

        let codecData: any;

        const command = ffmpeg(tmpPath, {})
            .outputOptions('-map', '0:a', '-map_metadata', '-1')
            .on('codecData', async function (data) {
                codecData = data;
            })
            .on('error', (err) => {
                log(err.message);

                return resolve(error("server", "body", "/track", "FFMPEG error"));
            })
            .on('end', async () => {
                /* Potentially add check for supported format here, as file extensions aren't surefire, check codecData.format */
                if (isSupportedCodec(codecData.audio)) {
                    const createTrackQuery = db.query(`INSERT INTO tracks (title, artist, uploaded_by) VALUES ($title, $artist, $uploaded_by) RETURNING *;`)

                    const trackInDB = createTrackQuery.get({
                        $title: title,
                        $artist: artist,
                        $uploaded_by: user.id
                    }) as track

                    fs.mkdirSync('./data/tracks/' + trackInDB.id)
                    fs.copyFileSync(tmpPath2, `./data/tracks/${trackInDB.id}/audio${fileExtension}`)

                    if (coverFile !== null) {
                        const coverArtExtension = getCoverArtFileExtension(coverFile);
                        fs.writeFileSync(`./data/tracks/${trackInDB.id}/cover${coverArtExtension}`, new Int8Array(await coverFile.arrayBuffer()));
                    }

                    format(trackInDB.id)
                    processCover(trackInDB.id)

                    fs.rmSync(tmpPath)
                    fs.rmSync(tmpPath2)

                    return resolve(response("Uploaded track, processing", undefined, `/tracks/${trackInDB.id}`))
                } else {
                    fs.rmSync(tmpPath)
                    fs.rmSync(tmpPath2)
                    console.log(codecData)
                    return resolve(error("validation", "body", "/track", "Unsupported audio codec"));
                }
            })
            .output(tmpPath2);

        command.run();
    })
}