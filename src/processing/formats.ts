import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { log } from '../logging';
import { db } from '../../data/db';

const enableSFlacQuery = db.query("UPDATE tracks SET s_flac = 1 WHERE id = $id;");
const enableSMp3Query = db.query("UPDATE tracks SET s_mp3 = 1 WHERE id = $id;");
const enableSWavQuery = db.query("UPDATE tracks SET s_wav = 1 WHERE id = $id;");
const enableSM4aQuery = db.query("UPDATE tracks SET s_m4a = 1 WHERE id = $id;");
const enableSOggsQuery = db.query("UPDATE tracks SET s_ogg = 1 WHERE id = $id;");

const enableMultiple = db.transaction((queries, id: number) => {
    for (const query of queries) query.run({
        $id: id
    });

    return queries.length;
})

export default function format(id: number) {
    if (!fs.existsSync(`data/tracks/${id}`)) {
        return log(`Failed to format track #${id}, no directory to pull data from`);
    }

    const queries = [];

    let files = fs.readdirSync(`data/tracks/${id}`);

    if (files.includes("audio.wav")) {
        convertToFLAC(id, 'wav');
        convertToOGG(id, 'wav');
        convertToMP3(id, 'wav');

        queries.push(enableSFlacQuery, enableSOggsQuery, enableSMp3Query)
    } else if (files.includes("audio.flac")) {
        convertToOGG(id, 'flac');
        convertToMP3(id, 'flac');
        
        queries.push(enableSOggsQuery, enableSMp3Query)
    } else if (files.includes("audio.mp3")) {
        convertToOGG(id, 'mp3');
        queries.push(enableSOggsQuery, enableSMp3Query)
    } else if (files.includes("audio.m4a")) {
        convertToOGG(id, 'm4a');
        convertToMP3(id, 'm4a');
        queries.push(enableSOggsQuery, enableSMp3Query)
    }
    
    enableMultiple(queries, id);
}

function convertToFLAC(id: number, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('flac')
        .format('flac')
        .audioBitrate(1411)
        .output(`data/tracks/${id}/audio.flac`)
        .run();
}

function convertToM4A(id: number, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('aac')
        .format('m4a')
        .audioBitrate(128)
        .output(`data/tracks/${id}/audio.m4a`)
        .run();
}

function convertToOGG(id: number, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('libopus')
        .format('ogg')
        .audioBitrate(86)
        .output(`data/tracks/${id}/audio.ogg`)
        .run();
}

function convertToMP3(id: number, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('libmp3lame')
        .format('mp3')
        .audioBitrate(128)
        .output(`data/tracks/${id}/audio.mp3`)
        .run();
}