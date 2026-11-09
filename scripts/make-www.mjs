// يجهّز فولدر www للأبلكيشن من ملفات الموقع نفسها، ويضيف جسر الموبايل (native.js)
import fs from 'node:fs';
import { build } from 'esbuild';

const OUT = 'www';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync('.')) {
  if (/\.(png|webmanifest)$/.test(f)) fs.copyFileSync(f, `${OUT}/${f}`);
}
let html = fs.readFileSync('index.html', 'utf8');
// جوه الأبلكيشن مفيش داعي للـ service worker
html = html.replace(/<script>if \('serviceWorker'[\s\S]*?<\/script>/, '');
html = html.replace('</head>', '<script src="native.js"></script>\n</head>');
fs.writeFileSync(`${OUT}/index.html`, html);
await build({
  entryPoints: ['native/entry.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: `${OUT}/native.js`,
  external: ['firebase', 'firebase/*'],
  legalComments: 'none',
  logLevel: 'warning',
});
console.log('www ready');
