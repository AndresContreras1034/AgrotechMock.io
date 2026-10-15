import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const js = (names) => names.map((n) => n + '.js');
const tree = {
  '.github/workflows': ['deploy.yml'],
  docs: ['guion-demo.md', 'decisiones.md'],
  tests: ['engine.test.js'],
  'src/config': js(['world', 'layout', 'beds', 'sensors', 'qualities', 'economy', 'diseases', 'orders', 'events']),
  'src/core': js(['state', 'clock', 'rng', 'eventBus', 'engine']),
  'src/sim': js(['water', 'soil', 'plantHealth', 'disease', 'yield', 'quality', 'economy', 'sensors']),
  'src/scenario': js(['script', 'endings']),
  'src/scenario/months': js(['enero', 'febrero', 'marzo', 'abril']),
  'src/render': js(['canvas', 'camera', 'drawTerrain', 'drawCreek', 'drawGreenhouses', 'drawSensors', 'drawStems', 'drawEvents', 'minimap', 'hitTest']),
  'src/ui': js(['hud', 'goalsBanner', 'monthPanel', 'decisionModal', 'contextMenu', 'sensorCard', 'plantCard', 'bedStats', 'shopPanel', 'report', 'toast']),
  'src/styles': ['main.css'],
  'src/utils': js(['format', 'math']),
  '.': ['README.md'],
};

mkdirSync('public/assets', { recursive: true });
for (const [dir, files] of Object.entries(tree)) {
  for (const f of files) {
    const path = dir === '.' ? f : `${dir}/${f}`;
    mkdirSync(dirname(path), { recursive: true });
    if (!existsSync(path)) writeFileSync(path, '');
  }
}
console.log('Estructura creada.');
