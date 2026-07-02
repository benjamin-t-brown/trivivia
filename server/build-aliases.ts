import path from 'path';
import { readdirSync } from 'fs';

export function buildSrcAliases(srcDir: string): Record<string, string> {
  const aliases: Record<string, string> = {
    src: srcDir,
  };
  const directories = new Set<string>();

  for (const dirent of readdirSync(srcDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }

    directories.add(dirent.name);
    aliases[dirent.name] = path.join(srcDir, dirent.name);
  }

  for (const dirent of readdirSync(srcDir, { withFileTypes: true })) {
    if (!dirent.isFile()) {
      continue;
    }

    const moduleName = dirent.name.replace(/(\.ts){1}(x?)$/, '');
    if (moduleName === dirent.name || directories.has(moduleName)) {
      continue;
    }

    aliases[moduleName] = path.join(srcDir, dirent.name);
  }

  return aliases;
}
