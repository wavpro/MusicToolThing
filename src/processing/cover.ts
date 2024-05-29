import fs from "fs"
import sharp from "sharp"
import { log } from "../logging";

export default function processCover(id: number): void {
    if (!fs.existsSync(`./data/tracks/${id}`)) {
        return log(`Failed to process cover for track #${id}, no directory to pull data from`);
    }

    let files = fs.readdirSync(`./data/tracks/${id}`);
    if (!files.includes("cover.jpg") && !files.includes("cover.png")) {
        fs.copyFileSync(`./data/pre_made_img/default_cover.png`, `./data/tracks/${id}/cover.png`)
        fs.copyFileSync(`./data/pre_made_img/default_cover_512.png`, `./data/tracks/${id}/cover_512.png`)
        fs.copyFileSync(`./data/pre_made_img/default_cover_128.png`, `./data/tracks/${id}/cover_128.png`)
        fs.copyFileSync(`./data/pre_made_img/default_cover_64.png`, `./data/tracks/${id}/cover_64.png`)
        return;
    }

    if (files.includes("cover.jpg")) {
        sharp(`./data/tracks/${id}/cover.jpg`)
            .resize(1000, 1000, {
                fit: sharp.fit.fill,
            })
            .toFile(`./data/tracks/${id}/cover.png`)
            .then(() => {
                fs.rmSync(`./data/tracks/${id}/cover.jpg`);

                createSubset(id)
            })

        return;
    }

    sharp(`./data/tracks/${id}/cover.png`)
        .resize(1000, 1000, {
            fit: sharp.fit.fill,
        })
        .toFile(`./data/tracks/${id}/cover.png`)
        .then(() => {
            createSubset(id)
        })
}

function createSubset(id: number) {
    sharp(`./data/tracks/${id}/cover.png`)
        .resize(512, 512, {
            fit: sharp.fit.cover,
        })
        .toFile(`./data/tracks/${id}/cover_512.png`);
    sharp(`./data/tracks/${id}/cover.png`)
        .resize(128, 128, {
            fit: sharp.fit.cover,
        })
        .toFile(`./data/tracks/${id}/cover_128.png`);
    sharp(`./data/tracks/${id}/cover.png`)
        .resize(64, 64, {
            fit: sharp.fit.cover,
        })
        .toFile(`./data/tracks/${id}/cover_64.png`);
}