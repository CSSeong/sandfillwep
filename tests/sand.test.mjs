import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function simulation(width = 80, height = 60, seed = 1) {
  const callbacks = new Map(), frames = new Map(), timers = [], elements = new Map();
  const paints = [];
  let frameId = 0;
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', hidden: false, dataset: {}, attributes: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(name, callback) { callbacks.set(`${id}:${name}`, callback); },
    });
    return elements.get(id);
  }
  const ctx = {
    createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData(...args) { paints.push(args.slice(1)); },
  };
  Object.assign(element('canvas'), {
    getContext: () => ctx, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
  });
  const palette = Array.from({ length: 5 }, (_, i) => Object.assign(element(`color${i + 1}`), { dataset: { color: String(i + 1) } }));
  const random = Object.create(Math);
  random.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  const window = { innerWidth: width, innerHeight: height, addEventListener(name, callback) { callbacks.set(`window:${name}`, callback); } };
  const context = vm.createContext({
    window, Math: random, HTMLInputElement: class {},
    document: { getElementById: element, querySelectorAll: () => palette, hidden: false,
      addEventListener(name, callback) { callbacks.set(`document:${name}`, callback); } },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback, delay) { timers.push({ callback, delay }); },
  });
  // Expose closure state only in the test harness; the shipped HTML has no debug API.
  const api = `
    globalThis.sand = {
      get grid() { return grid; }, get pixels() { return pixels; }, get palette() { return packedColors; },
      get W() { return W; }, get H() { return H; }, get count() { return count; }, get activeRows() { return activeRows; },
      step, draw, clear, resize, pause, sprinkle,
      add(x,y,shade) { const i=y*W+x; if(!grid[i]) count++; grid[i]=shade; markDirty(i); wakeRange(y,x,x); },
      remove(x,y) { const i=y*W+x; if(grid[i]) count--; grid[i]=0; markDirty(i); wakeRange(y-1,x-1,x+1); },
      pour(x,y,size=3) { pointer=[x,y]; brush=size; sprinkle(); pointer=null; },
    };`;
  vm.runInContext(script.replace('    })();', `${api}\n    })();`), context);
  return { sand: context.sand, paints, frames, timers, callbacks, element, palette, window };
}

function histogram(grid) {
  const result = new Array(86).fill(0);
  for (const shade of grid) if (shade) result[shade]++;
  return result;
}

function settle(sand, maxSteps = sand.H * sand.H * 2) {
  let steps = 0;
  while (sand.activeRows && steps++ < maxSteps) sand.step();
  assert.equal(sand.activeRows, 0, 'the pile should eventually sleep');
}

function assertPixels(sand) {
  sand.draw();
  for (let i = 0; i < sand.grid.length; i++) assert.equal(sand.pixels[i], sand.palette[sand.grid[i]], `pixel ${i}`);
}

function assertSupported(sand) {
  for (let y = 0; y < sand.H - 1; y++) for (let x = 0; x < sand.W; x++) if (sand.grid[y * sand.W + x]) {
    for (const dx of [-1, 0, 1]) if (x + dx >= 0 && x + dx < sand.W) {
      assert.ok(sand.grid[(y + 1) * sand.W + x + dx], `sleeping grain at ${x},${y} has an open destination`);
    }
  }
}

test('a grain falls once per step, keeps its shade, and stops drawing after settling', () => {
  const { sand, paints, frames } = simulation();
  sand.add(12, 2, 83);
  sand.step();
  assert.equal(sand.grid[3 * sand.W + 12], 83);
  assert.equal(sand.grid[2 * sand.W + 12], 0);
  settle(sand);
  assert.equal(sand.grid[(sand.H - 1) * sand.W + 12], 83);
  assert.equal(sand.count, 1);
  assertPixels(sand);
  const before = paints.length;
  for (let i = 0; i < 200; i++) { sand.step(); sand.draw(); }
  assert.equal(paints.length, before);
  assert.equal(frames.size, 0);
});

test('dirty rendering clears old positions and only uploads the changed rectangle', () => {
  const { sand, paints } = simulation();
  sand.add(10, 3, 17); sand.draw();
  assert.deepEqual(paints.at(-1), [0, 0, 10, 3, 1, 1]);
  sand.step();
  assertPixels(sand);
  assert.deepEqual(paints.at(-1), [0, 0, 10, 3, 1, 2]);
  assert.equal(sand.pixels[3 * sand.W + 10], 0xffffffff);
});

test('a fully packed pile sleeps and wakes when a supporting grain moves', () => {
  const { sand, paints } = simulation();
  for (let y = Math.floor(sand.H / 2); y < sand.H; y++) for (let x = 0; x < sand.W; x++) sand.add(x, y, (x + y) % 85 + 1);
  settle(sand); assertSupported(sand); assertPixels(sand);
  const before = paints.length, count = sand.count;
  sand.step(); sand.draw();
  assert.equal(paints.length, before);
  sand.remove(10, sand.H - 1);
  settle(sand);
  assert.ok(sand.grid[(sand.H - 1) * sand.W + 10]);
  assert.equal(sand.count, count - 1);
  assertSupported(sand); assertPixels(sand);
});

for (const seed of [1, 7, 42, 9001]) test(`scattered grains and new pours conserve every shade and leave no floating grains (seed ${seed})`, () => {
  const { sand } = simulation(100, 80, seed);
  for (let y = 0; y < sand.H - 3; y += 3) for (let x = 0; x < sand.W; x += 3) sand.add(x, y, (x * 3 + y) % 85 + 1);
  let before = histogram(sand.grid);
  settle(sand);
  assert.deepEqual(histogram(sand.grid), before);
  assertSupported(sand); assertPixels(sand);
  sand.pour(5, 1, 4); sand.pour(sand.W - 5, 3, 4);
  before = histogram(sand.grid);
  settle(sand);
  assert.deepEqual(histogram(sand.grid), before);
  assert.equal(histogram(sand.grid).reduce((a, b) => a + b, 0), sand.count);
  assertSupported(sand); assertPixels(sand);
});

test('the event-driven animation wakes on input, pauses, resumes and stops when idle', () => {
  const { sand, frames, callbacks, element } = simulation();
  const pointer = { button: 0, isPrimary: true, pointerId: 1, clientX: 25, clientY: 10, preventDefault() {} };
  assert.equal(frames.size, 0);
  callbacks.get('canvas:pointerdown')(pointer);
  assert.equal(frames.size, 1);
  const count = sand.count;
  sand.pause(); assert.equal(frames.size, 0);
  assert.equal(element('status').textContent, 'PAUSED');
  sand.pause(); assert.equal(frames.size, 1);
  for (let now = 25; frames.size && now < 10000; now += 25) {
    const [[id, callback]] = frames;
    frames.delete(id); callback(now);
  }
  assert.equal(frames.size, 0);
  assert.equal(sand.count, count);
  assertSupported(sand); assertPixels(sand);
});

test('resize retains visible grains, rebuilds activity and clearing resets all buffers', () => {
  const { sand, window, frames, element } = simulation();
  sand.add(10, 2, 1); sand.add(20, sand.H - 1, 85);
  const before = histogram(sand.grid);
  window.innerWidth += 20; window.innerHeight += 20;
  sand.resize();
  assert.deepEqual(histogram(sand.grid), before);
  settle(sand); assertSupported(sand); assertPixels(sand);
  sand.clear();
  assert.equal(sand.count, 0); assert.equal(sand.activeRows, 0); assert.equal(frames.size, 0);
  assert.equal(element('count').textContent, '0');
  assert.ok(sand.grid.every(value => value === 0));
  assert.ok(sand.pixels.every(value => value === 0xffffffff));
  sand.pour(10, 3); settle(sand); assert.ok(sand.count > 0); assertPixels(sand);
});

test('the single HTML keeps its white background, shade range and ten-second instructions', () => {
  const { sand, timers, element } = simulation();
  const bytes = new Uint8Array(sand.palette.buffer);
  assert.deepEqual(Array.from(bytes.slice(0, 4)), [255, 255, 255, 255]);
  const gold = Array.from({ length: 17 }, (_, shade) => bytes[(4 * 17 + shade + 1) * 4]);
  assert.equal(new Set(gold).size, 17);
  const hintTimer = timers.find(timer => timer.delay === 10000);
  assert.ok(hintTimer); hintTimer.callback(); assert.equal(element('hint').hidden, true);
  sand.clear(); assert.equal(element('hint').hidden, true);
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel=["']stylesheet/);
});
