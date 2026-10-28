// Builds orbit-source-context.md: the Envision transfer brief, a test inventory, and every
// tracked source file in one Markdown file for an AI coding agent (Gemini in Envision).
// Usage: node scripts/build-transfer.mjs [output path]   (no dependencies)
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'orbit-source-context.md';
const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter(f => !/\.(jpg|jpeg|png|gif|ico|bundle|zip)$/i.test(f))
  .filter(f => !/^(package-lock\.json|public\/guide\/img\/)/.test(f));

const lang = f =>
  ({ ts: 'ts', tsx: 'tsx', js: 'js', mjs: 'js', json: 'json', jsonc: 'jsonc', md: 'md', html: 'html', css: 'css', ps1: 'powershell', yml: 'yaml', yaml: 'yaml' })[
    f.split('.').pop()
  ] || '';

const tests = files
  .filter(f => /\.(test|spec)\.tsx?$/.test(f))
  .map(f => {
    const names = [...readFileSync(f, 'utf8').matchAll(/\btest\(\s*[`'"]([^`'"]+)[`'"]/g)].map(m => m[1]);
    return `### ${f}\n${names.map(n => `- ${n}`).join('\n')}`;
  });

const parts = [
  '# ORBIT source context for an AI coding agent',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} from branch ${execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()}. All data in the source is fictional.`,
  'Read Part 1 first. Part 2 lists every test. Part 3 is every source file with its path.',
  '',
  '# Part 1: Transfer brief',
  '',
  readFileSync('docs/ENVISION_TRANSFER.md', 'utf8'),
  '',
  '# Part 2: Test inventory',
  '',
  ...tests,
  '',
  '# Part 3: Source files',
  '',
  `${files.length} files.`,
  ''
];
for (const f of files) {
  const body = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const fence = body.includes('```') ? '````' : '```';
  parts.push(`## ${f}`, '', `${fence}${lang(f)}`, body.trimEnd(), fence, '');
}
writeFileSync(out, parts.join('\n'));
console.log(`Wrote ${out}: ${files.length} files, ${tests.length} test files`);
