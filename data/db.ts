import { Database } from "bun:sqlite";

export const db = new Database('./data/database.sqlite', { create: true });