// Derive mouth openings from the actual voice waveform. Run again after replacing P1 VO files.
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const source = fs.readFileSync('card.json', 'utf8');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const card = JSON.parse(source);
  const slide = card.slides.find(s => s.type === 'RING_TOSS');
  const ids = new Set(Object.values(slide.audio || {}));
  for (const q of slide.data.questions) {
    Object.values(q.audio).forEach(id => ids.add(id)); ids.add(q.target.audio);
    q.options.forEach(o => ids.add(o.audio));
  }
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage();
    const tracks = {};
    for (const id of ids) {
      const file = card.assets.audio[id];
      if (!file || !fs.existsSync(file)) continue;
      tracks[id] = await page.evaluate(async encoded => {
        const ctx = new AudioContext();
        try {
          const buffer = await ctx.decodeAudioData(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)).buffer);
          const pcm = buffer.getChannelData(0), step = Math.round(buffer.sampleRate * .04), rms = [];
          for (let i = 0; i < pcm.length; i += step) {
            let sum = 0; const end = Math.min(i + step, pcm.length);
            for (let j = i; j < end; j++) sum += pcm[j] * pcm[j];
            rms.push(Math.sqrt(sum / (end - i)));
          }
          const peak = Math.max(...rms, .001);
          return rms.map(x => x < peak * .075 ? '0' : x < peak * .25 ? '1' : x < peak * .55 ? '2' : '3').join('');
        } finally { await ctx.close(); }
      }, fs.readFileSync(file).toString('base64'));
    }
    slide.data.lip_sync = { step_ms: 40, tracks };
    fs.writeFileSync('card.json', (JSON.stringify(card, null, 1) + '\n').replace(/\n/g, newline));
    for (const file of ['HI02H04_L03_S02.html', 'index.html']) {
      const html = fs.readFileSync(file, 'utf8');
      const marker = '<script type="application/json" id="cardData">';
      const start = html.indexOf(marker);
      if (start < 0) throw Error('Missing cardData marker in ' + file);
      const content = start + marker.length;
      const end = html.indexOf('</script>', content);
      fs.writeFileSync(file, html.slice(0, content) + '\n' + JSON.stringify(card, null, 1) + '\n' + html.slice(end));
    }
    console.log('Built voice-synchronised mouth tracks:', Object.keys(tracks).length);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
