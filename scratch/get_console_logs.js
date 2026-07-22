import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\nandh\\.gemini\\antigravity-ide\\brain\\32e8870c-1638-4318-a9d1-4d1f1068904e\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('capture_browser_console_logs')) {
      console.log("MATCH:");
      console.log(line.substring(0, 1000));
      console.log("\n=========================================\n");
    }
  }
}

run();
