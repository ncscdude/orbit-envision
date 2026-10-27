/**
 * Term guard. Fails if any excluded outside phrase reappears in source.
 * Phrases are stored only as SHA-256 hashes of normalized text, so this file
 * does not itself contain them. See docs/TERM_ORIGINS.md for the policy.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EXCLUDED: { words: number; sha256: string }[] = [
  { words: 6, sha256: '54c697dd35ef6668b6edb2e6055f4d10be7ddd55866a55eb48592687e759424e' },
  { words: 5, sha256: '9ee3d6209c62388fc4fc98b8f5153c1501bec36e25ac758dde59958a306e2392' },
  { words: 3, sha256: '9b96197f1d33f2093602237ae8db1b3866168a5569cfe161d363f551e0b25cca' },
  { words: 3, sha256: '9f0aed7ab835619507dc74a076255f39ab961873c6f3108f4094eaf64f396e14' },
  { words: 6, sha256: '92ed166405a16a4c45e70624dd01d3d6fc69e8c2c9d32e9738699790a85a8093' },
  { words: 5, sha256: '6499dad63dd4b7ffdd74d4d344bc009d17452ab6b5481302d86733d4943943fc' },
  { words: 3, sha256: '29f6e15559c3ad2abede8a9bff6bbad78ccfe60aafdff9ceb2ab817cda167f5d' },
  { words: 2, sha256: 'bf251da0d6977cc4afbbd7f632a4b4152f824d3c557b1fa9030791f1cb129e47' },
  { words: 2, sha256: '188bb736a68f9ee231644d2e80965b03362236dff360d3f0501df673d7240ef2' },
  { words: 2, sha256: '1fb3dee83e8446f4f6537c784bd50fcce51a3172d10a21ad255c62f071bf20d6' },
  { words: 3, sha256: '5fdaa3de78abebb35a5e5d1e012b9c55092a42f430a12e3f53196181ff157531' },
  { words: 4, sha256: '26a0e9194ab400c7703bc3de8ddba2020f211e3962219b10b1ea8f6c8dbba920' },
  { words: 5, sha256: 'a6480864eb2f7db5edc68a38458ae5ca7d5560d26c171a840be394f473899430' },
  { words: 3, sha256: 'e872680bd0f74e5be9e0bf618d010cc349ad79a05c88c1111d3bd0364680ea6b' },
  { words: 2, sha256: '185c7dfae582fe905a5590b8988d070fbe8b9157f44ad20477e3e7a876a9ee81' },
  { words: 2, sha256: '1dbde199e392a64ccb4c0dfcba25facec277d06189c9b66145fe3992a75a9fd6' },
  { words: 3, sha256: '8539b18a10de78bc4e8ee7a1d53cb67ff279a30a5601c5b3f010d9a8f17b95e9' },
  { words: 2, sha256: '1bf110eae61136174568c2298e703503f6b05fa182c9b7ed6829ff72b9e92786' },
  { words: 4, sha256: 'bdc335367d2909a947201864a3ecd707438464482a9d2e30ecded2758076728a' },
  { words: 5, sha256: '9c63872b0d00f757fa276919f31468705b8f6136226a717b09552cc0d429dce7' },
  { words: 4, sha256: 'a8be911b023d4dc916ac25102ecb236ab6b9bbf1cd1f98978010a861031daeae' },
  { words: 3, sha256: 'a051cd59a8352e9e257f6d967bde8d9d3d22b0546bbd2c3b2e39f255be53c522' },
  { words: 3, sha256: 'f58c6faccd437c9906e167dd34bd8e3fbda1f7c39355b38b9392a5d0f38e50d6' },
  { words: 2, sha256: '595875b1b5164cb6ef16220222f56b33f23447e8f50f55c93018c0ac09fd1298' },
  { words: 3, sha256: 'f13d996e0e3363278a404bfc06cfc723498d6b3f162c5d7032578f754a641576' },
  { words: 4, sha256: 'e022e7eee0037459a90a865d6def93b92577fd03cb78bcfdacc52f11b607e9d5' },
  { words: 2, sha256: '1c1bde494f22b306b75c3bb1a31ed8e476cf2ab5fe67383f547439dce747f6c7' },
  { words: 3, sha256: 'c3ad7caa94a7c73d8f8f6b854a88bac8ff0e0e259ce3ab735f16afac102ba28f' },
  { words: 2, sha256: '72490c530f73bbd4edbab750424c3d7288ecfbc2e7219839ec7bf64cc058e534' },
  { words: 3, sha256: 'db8b0a56196de39b27bd36a8901a96acefb1e60b2a21b63762235693754ed82d' },
  { words: 3, sha256: 'cf044833afa36bc2bcec9aff9143c932a9d85ee3a22e519953f7d953defeff2a' },
  { words: 3, sha256: 'b30201428b22dc29bd7bf93c6587749ea064a06d63c9190f1f7af40d35d4a6da' },
  { words: 3, sha256: 'a50c3f89cc307349dee6d3f7714e3e1b6c7ebaa22261ce9d815db4d90c20ac3b' },
  { words: 2, sha256: '287260433df2ea47ed6b26ee0d7ec64ce352dbf4182172bf14c70c5bc4ea0fe0' },
  { words: 3, sha256: '72150ca21dcc9b836f23d367b874409e7f4dcc7bd0ee4788f5e09dba754fa38e' },
  { words: 4, sha256: '762be53d6d76f0cf4d0c18caf96e361249eb0f17939df5a62a97c0b254da7813' },
  { words: 3, sha256: '9ba43a0b9a9a89ed3148e9540efa13d944b86cc24b5c6faaea0143b4582462ee' },
  { words: 4, sha256: 'ddadc130a126997438c705d452f24f698953cb07c0b3bc55981ecacf4ca848f1' },
  { words: 3, sha256: '8cd0e9146a7a12c9c9ef3e1829f52523b469ac9954f9a56cd94c1799fdf71a41' },
  { words: 3, sha256: 'b632aa7d8de6df063d8d8ee2c18a2b99688e7f6ad958ed3e8e203c2a3b182acb' },
  { words: 3, sha256: '193759a969be22376b248d51b93ff8ec31babd32832d75ec097ea8105d382ac6' },
  { words: 3, sha256: '52034800a1b80d449758de204e767e94efd07f5c95304015a6a806d2c7ec2cb8' },
  { words: 3, sha256: '141568194a64955029588737ca098ce61c4bdd5c0367c83b5fc683ad0dccddd9' },
  { words: 4, sha256: 'f4d1c81b960ad486b249fe32744c7ce7c4775557c571a3e5b006c425b69ab50d' },
  { words: 4, sha256: 'd932aa4091717d9fa6972a355c28f0de274df6834955d103011139ccf0ed69e6' },
  { words: 3, sha256: 'cbf4450ff0c1ccba587d0339cba4af6201c1afdc7818230959bf378fe242a430' },
  { words: 4, sha256: '357e97f9de3e1a2b942e2f2602d8c80b5212ea8a3c0c7bb970cb196e45033973' },
];

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sha = (t: string) => createHash('sha256').update(t).digest('hex');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx|css|html)$/.test(name) && !name.endsWith('termGuard.test.ts') ? [p] : [];
  });
}

test('no excluded outside phrases appear in ORBIT source', () => {
  const sizes = [...new Set(EXCLUDED.map(e => e.words))];
  const wanted = new Set(EXCLUDED.map(e => e.sha256));
  const hits: string[] = [];
  for (const file of [...sourceFiles('src'), 'index.html']) {
    const words = normalize(readFileSync(file, 'utf8')).split(' ');
    for (const n of sizes) {
      for (let i = 0; i + n <= words.length; i++) {
        if (wanted.has(sha(words.slice(i, i + n).join(' ')))) hits.push(`${file} (word ${i})`);
      }
    }
  }
  assert.deepEqual(hits, [], `Excluded phrases found: ${hits.join(', ')}`);
});
