import { Database } from "bun:sqlite";
import { join } from "path";
import setup from "./data/database.sqlite.ts";
import router from "./src/routes";

const DBPath = join(import.meta.dir, "data", "database.sqlite");

const db = new Database(DBPath, { create: true });

setup(db);
router(db);
