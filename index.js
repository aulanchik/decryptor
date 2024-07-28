const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { API_URL, CONTENDER } = process.env;

async function fetchInitialTask(contender) {
    try {
        const { data } = await axios.get(`${API_URL}/${contender}`);

        console.log(data);
        const result = decrypt(data.encrypted_path, data.encryption_method);
        await fetchNextTask(result);

    } catch(error) {
        console.error(`Failed to fetch initial task: ${error.message || error}`);
    }
}

async function fetchNextTask(token) {
    try {
        const { data } = await axios.get(`${API_URL}/${token}`);
        const result = decrypt(data.encrypted_path, data.encryption_method);
        await fetchNextTask(result);
    } catch (error) {
        console.error(`Failed to fetch task: ${error.message || error}`);
    }
}

function decrypt(token, method) {
    const path = token.replace(/[^a-zA-Z0-9\s,\[\]_]/g, '').replace(/task_/g, '');

    switch(method) {
        case 'nothing':
            return `task_${path}`;
        case 'converted to a JSON array of ASCII values': 
            return `task_${convertAsciiToJson(path)}`;
        case 'inserted some non-hex characters': 
            return `task_${removeNonHexChars(path)}`;
        default:
            console.log(`Unknown encryption method received: ${method}`);
    }
}

function removeNonHexChars(inputString) {
    return inputString.replace(/[^a-fA-F0-9]/g, '');
}

function convertAsciiToJson(inputString) {
    const asciiArray = JSON.parse(inputString);
    return asciiArray.map(code => String.fromCharCode(code)).join('');
}

function main() {
    fetchInitialTask(CONTENDER);
}

main();
