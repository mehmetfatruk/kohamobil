import { stdin, stdout } from 'node:process';
import { createInterface, type Interface } from 'node:readline';

/**
 * Komut satırı soru yardımcısı: tek okuyucu kullanır (yönlendirilmiş girdide satırlar kaybolmaz),
 * gizli girişte yazılanları ekrana basmaz.
 */
export function createPrompt() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
    terminal: Boolean(stdin.isTTY),
  }) as Interface & {
    _writeToOutput?: (text: string) => void;
  };
  const lines: string[] = [];
  const waiters: ((line: string) => void)[] = [];
  let muted = false;
  rl.on('line', (line) => {
    const waiter = waiters.shift();
    if (waiter) waiter(line);
    else lines.push(line);
  });
  rl.on('close', () => {
    for (const waiter of waiters.splice(0)) waiter('');
  });
  const write = rl._writeToOutput?.bind(rl);
  if (write) {
    rl._writeToOutput = (text: string) => {
      if (!muted || text.includes('\n') || text.includes('\r')) write(text);
    };
  }

  return {
    ask(question: string, options: { hidden?: boolean } = {}): Promise<string> {
      stdout.write(question);
      muted = Boolean(options.hidden);
      return new Promise((resolve) => {
        const done = (answer: string) => {
          muted = false;
          if (options.hidden && stdin.isTTY) stdout.write('\n');
          resolve(answer.trim());
        };
        const queued = lines.shift();
        if (queued !== undefined) done(queued);
        else waiters.push(done);
      });
    },
    close: () => rl.close(),
  };
}
