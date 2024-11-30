import setup from "./data/database.sqlite.ts";
import router from "./src/routes";
import { db } from "./data/db.ts";
//import youtube from "./src/songs/index.ts";

setup(db);
router();

//await youtube.getSongInfoYoutube("https://www.youtube.com/watch?v=Se237UXFKlQ")