import type { BunFile } from "bun";
import { error, type ErrorResponse } from "../response/error";
import { AudioQualities } from "../routes";
import fs from 'fs'

const chunk_size = 1024 * 1024 * 2;

type Status = number;
type Headers = Record<string, string>;

function getContentType(quality: AudioQualities): string {
    switch (quality) {
        case AudioQualities.AAC:
            return 'audio/aac';
        case AudioQualities.FLAC:
            return 'audio/flac';
        case AudioQualities.MPEG:
            return 'audio/mpeg';
        case AudioQualities.Opus:
            return 'audio/ogg';
        case AudioQualities.WAVE:
            return 'audio/wav';
        default:
            return 'audio';
    }
}

export async function getChunkOfFile(filepath: string, headers: Record<string, string | undefined>, quality: AudioQualities): Promise<[BunFile | ErrorResponse, Headers, Status]> {
    const file = Bun.file(filepath, { type: getContentType(quality) })
    if (!await file.exists()) {
        return [error("validation", "body", "file", "File doesn't exist"), {}, 404];
    }

    if (headers.range !== undefined && headers.range !== "bytes=0-") {
        // @ts-ignore
        let [start = 0, end = file.size - 1] = headers
            // @ts-ignore
            .range // bytes=0-100
            .split("=") // ["bytes", "0-100"]
            .at(-1) // "0-100"
            .split("-") // ["0", "100"]
            .map((x, _, whole) => {
                if (x === '') {
                    return parseInt(whole[0]) + chunk_size;
                }

                return +x;
            }) // [0, 100]

        if (end + 1 > file.size) {
            end = file.size - 1
        }

        return [file.slice(start, end + 1), {
            "content-range": `bytes ${start}-${end}/${file.size}`,
            "content-type": getContentType(quality),
            "accept-ranges": "bytes"
        }, 206]
    }

    return [file, {
        'content-range': 'bytes ' + 0 + '-' + file.size + '/' + file.size,
        'content-type': getContentType(quality)
    }, 200];
}
export function getFileSize(filepath: string): number {
    const file = Bun.file(filepath);

    return file.size;
}

async function getFile(filePath: string, start: number, end: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const chunks: (Buffer | string)[] = [];
        fs.createReadStream(filePath, { start, end })
            .on('data', (chunk) => {
                chunks.push(chunk);
            })
            .on('end', () => {
                let data: Blob = new Blob(chunks);

                resolve(data);
            })
    })
}