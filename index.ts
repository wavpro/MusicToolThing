import setup from "./data/database.sqlite.ts";
import router from "./src/routes";
import { db } from "./data/db.ts";

setup(db);
router();