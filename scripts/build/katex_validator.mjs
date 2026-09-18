import readline from 'readline';
import katex from 'katex';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let id = null;
  try {
    const payload = JSON.parse(trimmed);
    id = payload.id;
    katex.renderToString(payload.formula || '', {
      displayMode: Boolean(payload.displayMode),
      throwOnError: true,
      strict: false,
    });
    console.log(JSON.stringify({ id, ok: true }));
  } catch (err) {
    console.log(JSON.stringify({ id, ok: false, error: err?.message || String(err) }));
  }
});
