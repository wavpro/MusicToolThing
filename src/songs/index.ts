import ytdlCore from "@distube/ytdl-core";
import { MusicBrainzApi } from 'musicbrainz-api';
import packageJSON from "../../package.json";
import saveTrack from "../processing/save_track";
import { Readable } from "stream";
import type { user } from "../../data/database.sqlite";

export type SongInfo = {
    title: string;
    artist: string;
}

class SongHandler {
    ytdl: typeof ytdlCore;
    mBApi: MusicBrainzApi;

    constructor() {
        this.ytdl = ytdlCore;
        this.mBApi = new MusicBrainzApi({
            appName: packageJSON.name || "MusicToolThing",
            // @ts-ignore
            appVersion: packageJSON.version || '0.1.0',
            appContactInfo: process.env.ADMIN_EMAIL_ADDRESS,
        });
    }

    async saveSongYoutube(youtube_url: string, user: user): Promise<string | undefined> {
        const ytdlInfo = await this.ytdl.getBasicInfo(youtube_url);
        const { videoDetails } = ytdlInfo;
        const fullSizeThumbnailUrl = videoDetails.thumbnails.find(t => t.url.includes("maxresdefault"))?.url
            || videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url
        const res = await fetch(fullSizeThumbnailUrl);
        if (!res.body) {
            return "Couldn't fetch thumbnail";
        }
        saveTrack(videoDetails.title, videoDetails.author.name, this.ytdl.downloadFromInfo(ytdlInfo), res.body, user)
        return 
    }
}

export default new SongHandler();