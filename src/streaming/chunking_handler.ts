import type { BunFile } from "bun";
import { error, type ErrorResponse } from "../response/error";

export async function getChunkOfFile(filepath: string, headers: Record<string, string | undefined>, set: any): Promise<BunFile | ErrorResponse>{
    const file = Bun.file(filepath);
    if (!await file.exists()) return error("server", "body", "file", "File doesn't exist");

    if (headers.range !== undefined) {
        const chunk = 1048576;
        let [start = 0, end = Infinity] = headers.range.split('=').at(-1).split('-').map(Number);
        if (end == 0) end = start + chunk < file.size ? start + chunk : file.size;
        return file.slice(start, start + chunk);
       } else {
        return new Response(file, {
         headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="' + req.params.name + '"'
         }
        });
}