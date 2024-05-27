import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { log } from '../logging';

export default function format(id: string) {
    if (!fs.existsSync(`data/tracks/${id}`)) {
        return log(`Failed to format track #${id}, no directory to pull data from`);
    }

    let files = fs.readdirSync(`data/tracks/${id}`);

    if (files.includes("audio.wav")) {
        convertToFLAC(id, 'wav');
        convertToM4A(id, 'wav');
        convertToOGG(id, 'wav');
    } else if (files.includes("audio.flac")) {
        convertToM4A(id, 'flac');
        convertToOGG(id, 'flac');
    } else if (files.includes("audio.mp3")) {
        convertToM4A(id, 'mp3');
        convertToOGG(id, 'mp3');
    } else if (files.includes("audio.m4a")) {
        convertToOGG(id, 'm4a');
    }
    
}

function convertToFLAC(id: string, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('flac')
        .format('flac')
        .audioBitrate(1411)
        .output(`data/tracks/${id}/audio.flac`)
        .run();
}

function convertToM4A(id: string, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('aac')
        .format('m4a')
        .audioBitrate(128)
        .output(`data/tracks/${id}/audio.m4a`)
        .run();
}

function convertToOGG(id: string, extension: string) {
    ffmpeg(`data/tracks/${id}/audio.${extension}`)
        .audioCodec('libopus')
        .format('ogg')
        .audioBitrate(86)
        .output(`data/tracks/${id}/audio.ogg`)
        .run();
}