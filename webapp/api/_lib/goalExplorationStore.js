import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// Local, durable exposure counters only. Never stores selected goals, drafts or answers.
// The lock serializes processes too; atomic rename prevents partial budget records.
export function createFileExplorationStore(directory) {
  const root = resolve(directory);
  return {
    async withScope(key, update) {
      if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Invalid exploration scope');
      await mkdir(root, { recursive: true, mode: 0o700 });
      const path = resolve(root, `${key}.json`);
      const lock = `${path}.lock`;
      let handle;
      const started = Date.now();
      while (!handle) {
        try { handle = await open(lock, 'wx', 0o600); }
        catch (error) {
          if (error.code !== 'EEXIST') throw error;
          // No upstream requests are allowed inside this short critical section.
          const info = await stat(lock).catch(() => null);
          if (info && Date.now() - info.mtimeMs > 60000) await unlink(lock).catch(() => {});
          if (Date.now() - started > 2000) throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 503 });
          await new Promise(done => setTimeout(done, 15));
        }
      }
      let temporary;
      try {
        let value = null;
        try { value = JSON.parse(await readFile(path, 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; } // Corruption fails closed.
        const { state, result } = update(value);
        temporary = `${path}.${randomUUID()}.tmp`;
        await open(temporary, 'wx', 0o600).then(async file => {
          try { await file.writeFile(JSON.stringify(state)); await file.sync(); }
          finally { await file.close(); }
        });
        await rename(temporary, path);
        return result;
      } finally {
        if (temporary) await unlink(temporary).catch(() => {});
        await handle.close();
        await unlink(lock);
      }
    },
  };
}
