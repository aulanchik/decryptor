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
        console.log(`\nChallenge ${data.level}: `, data);
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
        case 'swapped every pair of characters': 
            return `task_${swapCharacterPairs(path)}`;
        case 'encoded as base64':
            return `task_${decodeBase64(path)}`;
            default:
            if (method.includes('circularly rotated left by')) {
                return `task_${performCircularShift(path, method)}`;
            }

            if(method.includes('to ASCII value of each character')) {
                return `task_${performOperationToAscii(path, method)}`;
            }

            throw new Error(`Unknown encryption method received: ${method}`);
    }
}

function removeNonHexChars(inputString) {
    return inputString.replace(/[^a-fA-F0-9]/g, '');
}

function convertAsciiToJson(inputString) {
    const asciiArray = JSON.parse(inputString);
    return asciiArray.map(code => String.fromCharCode(code)).join('');
}

function swapCharacterPairs(inputString) {
    let cleanString = inputString.replace(/\s/g, '').trim();
    
    let result = ''; 
    
    for (let i = 0; i < cleanString.length; i += 2) {
        const firstCharacter = cleanString[i];
        const secondCharacter = cleanString[i + 1];
        result += secondCharacter ? secondCharacter + firstCharacter : firstCharacter;
    }

    return result;
}

function performCircularShift(inputString, method) {
    const offset = extractValue(method);
    const adjustedOffset = offset % inputString.length;
    return inputString.slice(adjustedOffset) + inputString.slice(0, adjustedOffset);
}

function performOperationToAscii(inputString, method) {
    const value = extractValue(method);

    console.debug(`Value: ${value}`);

    let result = '';

    for (let char of inputString) {
        const asciiCode = char.charCodeAt(0);
        const newAsciiCode = asciiCode + value;

        console.debug(`ASCII: ${asciiCode}, New ASCII: ${newAsciiCode}`);
        result += String.fromCharCode(newAsciiCode);
    }

    console.debug(`Result: ${result}`);

    return result;
}

function extractValue(inputString) {
    const match = inputString.match(/-?\d+/);
    return match ? parseInt(match[0]) : 0;
}

function decodeBase64(inputString) {
    return Buffer.from(inputString, 'base64').toString('ascii');
}

function main() {
    fetchInitialTask(CONTENDER);
}

main();
