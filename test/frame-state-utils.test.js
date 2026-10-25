const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.DmShieldFrameState = {};
eval(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'src', 'shared', 'frame-state-utils.js'), 'utf8'));
const { selectFrameState } = globalThis.DmShieldFrameState;

test('优先选择已启用且有遮挡区域的 frame', () => {
  const result = selectFrameState([
    { frameId: 0, state: { enabled: false, hasRegion: false } },
    { frameId: 2, state: { enabled: true, hasRegion: true } },
  ]);
  assert.equal(result.frameId, 2);
});

test('没有有效状态时返回 null', () => {
  assert.equal(selectFrameState([{ frameId: 0, state: null }]), null);
});

test('同等状态保留先出现的 frame', () => {
  const result = selectFrameState([
    { frameId: 0, state: { enabled: false, hasRegion: true } },
    { frameId: 1, state: { enabled: false, hasRegion: true } },
  ]);
  assert.equal(result.frameId, 0);
});
