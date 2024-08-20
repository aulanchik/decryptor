const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { API_URL, CONTENDER } = process.env;

async function fetchInitialTask(contender) {
    try {
        const { data } = await axios.get(`${API_URL}/${contender}`);
        console.log(data);

        const result = decrypt(data.encrypted_path, data.encryption_method);

        const tasks = [];
        tasks.push(fetchNextTask(result));
        
        await Promise.all(tasks);
    } catch(error) {
        console.error(`Failed to fetch initial task: ${error.message || error}`);
    }
}

async function fetchNextTask(token) {
    try {
        const { data } = await axios.get(`${API_URL}/${token}`);
        console.log(`\nChallenge ${data.level}: `, data);
        const result = decrypt(data.encrypted_path, data.encryption_method);
        await fetchNextTask(result);
    } catch (error) {
        console.error(`Failed to fetch task: ${error.message || error}`);
    }
}

function decrypt(token, method) {
    const path = token.replace('task_', '');

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
                const decryptedTask = performOperationToAscii(path, method);
                return `task_${cleanupString(decryptedTask)}`;
            }

            if(method.includes('encoded it with custom hex character set')) {
                return `task_${decodeCustomHexSet(path, method)}`;
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
    const cleanString = inputString.replace(/\s/g, '').trim();

    return cleanString.replace(/../g, (match) => {
        const [firstChar, secondChar] = match;
        return secondChar ? `${secondChar}${firstChar}` : firstChar;
    });
}

function performCircularShift(inputString, method) {
    const offset = extractValue(method);
    const adjustedOffset = offset % inputString.length;
    return inputString.slice(adjustedOffset) + inputString.slice(0, adjustedOffset);
}

function performOperationToAscii(inputString, method) {
    const shiftValue = extractValue(method);
    return Array.from(inputString, char => String.fromCharCode(char.charCodeAt(0) + shiftValue)).join('');
}

function cleanupString(inputString) {
    return inputString.replace(/[^a-zA-Z0-9-_:?;]/g, ''); 
}

function extractValue(inputString) {
    const match = inputString.match(/-?\d+/);
    return match ? parseInt(match[0]) : 0;
}

function decodeBase64(inputString) {
    return Buffer.from(inputString, 'base64').toString('ascii');
}

function decodeCustomHexSet(inputString, method) {
    const parts = method.split('custom hex character set ');
    if (parts.length < 2) {
        throw new Error('Custom hex character set not found in method');
    }

    const customHexSet = parts[1].slice(0, 16);
    const encryptedHex = inputString.replace('task_', '');

    if (customHexSet.length !== 16) {
        throw new Error('Custom hex character set length is not 16');
    }

    const standardHexSet = '0123456789abcdef';
    const hexMapping = {};
    for (let i = 0; i < customHexSet.length; i++) {
        hexMapping[customHexSet[i]] = standardHexSet[i];
    }

    const standardHexString = encryptedHex.split('')
        .map(char => hexMapping[char] || '')
        .join('');

    if (standardHexString.length % 2 !== 0) {
        throw new Error('Invalid standard hex string length');
    }

    const buffer = Buffer.from(standardHexString, 'hex');

    return buffer.toString('utf8');
}

function main() {
    fetchInitialTask(CONTENDER);
}

main();
