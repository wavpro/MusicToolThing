import fs from 'fs';

const LOG_FILE = '../../log.txt';

if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, createMessage("Log file initialized"))
}

function createMessage(message: string) {
    return `[${new Date().toString()}]: ${message}`;
}

export function log(message: string) {
    fs.appendFile(LOG_FILE, createMessage("Log file initialized"), () => {})
}