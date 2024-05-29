import fs from "fs"
import sharp from "sharp"
import { log } from "../logging";

export default function processCover(id: number): void {
    if (!fs.existsSync(`./data/tracks/${id}`)) {
        return log(`Failed to process cover for track #${id}, no directory to pull data from`);
    }
    
    let files = fs.readdirSync(`./data/tracks/${id}`);
    if (!files.includes("cover.jpg") && !files.includes("cover.png")) {
        fs.copyFileSync(`./data/default_cover.png`, `./data/tracks/${id}/cover.png`)
        return;
    }

    if (files.includes("cover.jpg")) {
        sharp(`./data/tracks/${id}/cover.jpg`)
            .resize(1000, 1000, {
                fit: sharp.fit.fill,
            })
            .toFile(`./data/tracks/${id}/cover.png`);

        return;
    }

    sharp(`./data/tracks${id}/cover.png`)
        .resize(1000, 1000, {
            fit: sharp.fit.fill,
        })
        .toFile(`./data/tracks/${id}/cover.png`);
}