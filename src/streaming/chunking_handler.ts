import type { BunFile } from "bun";
import { error, type ErrorResponse } from "../response/error";
import { AudioQualities } from "../routes";
import fs from 'fs'

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
    const file = Bun.file(filepath, { type: getContentType(quality) });

    try {
        file.text();
    } catch(e) {
        return [error("server", "body", "file", "File doesn't exist"), {}, 500];
    }

    if (headers.range !== undefined) {
        const chunk = 1048576;
        let [start = 0, end = Infinity] = headers.range.split('=')?.[1]?.split('-').map(Number) || headers.range.split('-').map(Number);
        if (end == 0) end = start + (chunk < file.size ? start + chunk : file.size);

        return [file.slice(start, end), {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + file.size,
            'Content-Type': getContentType(quality)
        }, 206];
    } else {
        return [file, {
            'Content-Range': 'bytes ' + 0 + '-' + file.size + '/' + file.size,
            'Content-Type': getContentType(quality)
        }, 200];
    }
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