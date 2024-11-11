import { getTrackInfo, getTrackSize } from "./handleRequests";

const quality = 1;
const chunk_size = 1024 * 1024;

const AudioQualities = {
    Opus: 0,
    FLAC: 1,
    WAVE: 2,
    MPEG: 3,
    AAC: 4
}

function getContentType(quality) {
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

export default class PlayerHandler {
    track_size = 0;
    track_info = {};
    chunks = {};
    current_chunk = 0;
    constructor() { }
    switchTrack(track_id) {
        const _this = this;
        return new Promise(async function (resolve, reject) {
            try {
                _this.track_size = await getTrackSize(track_id, quality);
                _this.track_info = await getTrackInfo(track_id);
                _this.loadChunk(1);
            } catch (err) {

            }
        })
    }
    loadChunk(which) {
        const _this = this;
        return new Promise(async (resolve) => {
            if (!_this.chunks[which - 1]) {
                await _this.loadChunk(which - 1);
            }
            const audio = document.createElement("audio");
            const source = document.createElement("source");

            source.src = `http://localhost:4000/tracks/1/audio?quality=${quality}&range=${(which-1)*chunk_size}-${which*chunk_size}`;
            source.type = getContentType(quality);

            audio.appendChild(source);
            document.getElementById("player").appendChild(audio);

            const startTime = _this.chunks[which-1]?.timeRange || 0;

            _this.chunks[which] = {
                timeRange: [startTime, startTime + Math.round(audio.duration * 1000)],
                element: audio
            };
            audio.addEventListener("loadeddata", () => {
                console.log(`Chunk ${which} loaded`);
                resolve();
            })
        })
    }

    play(timestamp) {
        for (const chunk of this.chunks) {
            if (chunk.timeRange[1] >= timestamp) {
                chunk.element.currentTime = timestamp - chunk.timeRange[0];
                chunk.element.play();
                break;
            }
        }
    }
}