const fs = require('fs');

/** Given a JSON file, reads file and returns parsed json object. */
export const readFileContents = (file: string): any[] => {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(err);
        return [];
    }
};
