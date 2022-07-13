/** Call `yarn test:unique-known-accounts` to test. */


const fs = require('fs');

/** Given a JSON file, reads file and returns parsed json object. */
const readFileContents = (file) => {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        throw new Error(err);
        return [];
    }
};

const knownAddressSet = new Set();
const knownAddressMap = new Map();

let failure = false;

const readKnownAccountFiles = (file) => {
    const type = file.split('/')[3].replace('.json', '');
  //  console.log(`Tested unique address for local known-account: ${type}`);
    const accounts = readFileContents(file);
    accounts.map((account) => {
        if (!knownAddressSet.has(account.address)) {
            knownAddressSet.add(account.address);
            account.file = file;
            knownAddressMap.set(account.address, account);
        } else {
            failure = true;
            const known = knownAddressMap.get(account.address);
            console.error(`
Duplicated Alias Found!
${account.address} (${account.alias}) ${file}
${known.address} (${known.alias}) ${known.file}`);
        }
    })
};

let KNOWN_ACCOUNTS_FILES = [
    'burn',
    'distribution',
    'donation',
    'event',
    'exchange',
    'faucet',
    'gambling',
    'representative',
    'service',
    'team-member',
]


KNOWN_ACCOUNTS_FILES.map((file) => {
    console.log(`reading ${file}`);
    readKnownAccountFiles(`database/banano/known-accounts/${file}.json`);
});

if (failure) {
    throw new Error('Duplicate accounts found');
} else {
    console.log('No duplicate known accounts found');
}
