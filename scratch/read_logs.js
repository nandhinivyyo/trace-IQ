import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\nandh\\.gemini\\antigravity-ide\\brain\\32e8870c-1638-4318-a9d1-4d1f1068904e\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (line.includes('ReferenceError') || line.includes('consoleLogs is not defined')) {
      console.log(`Line ${index} matches:`);
      const pos = line.indexOf('ReferenceError');
      console.log(line.substring(Math.max(0, pos - 150), Math.min(line.length, pos + 250)));
      console.log("=========================================");
    }
  }
}

run();
