const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.DmShieldUtils = {};
eval(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'src', 'shared', 'overlay-utils.js'), 'utf8'));
const { centerRegion, normalizePoint, containRect, shouldEnterEdit, defaultState } = globalThis.DmShieldUtils;

test('自动居中只改变水平位置，不改变尺寸', () => {
  const region = { x: 0.12, y: 0.3, w: 0.4, h: 0.2 };
  assert.deepEqual(centerRegion(region), { x: 0.3, y: 0.3, w: 0.4, h: 0.2 });
});

test('自动居中不会修改原始选区', () => {
  const region = { x: 0.1, y: 0.2, w: 0.6, h: 0.3 };
  centerRegion(region);
  assert.equal(region.x, 0.1);
});

test('指针坐标按播放器矩形归一化并限制在边界内', () => {
  const rect = { left: 100, top: 50, width: 800, height: 400 };
  assert.deepEqual(normalizePoint(500, 250, rect), { x: 0.5, y: 0.5 });
  assert.deepEqual(normalizePoint(0, 1000, rect), { x: 0, y: 1 });
});

test('全屏 contain 视频计算实际画面区域', () => {
  const rect = containRect({ left: 0, top: 0, width: 1200, height: 800 }, 16, 9);
  assert.equal(rect.width, 1200);
  assert.equal(rect.height, 675);
  assert.equal(rect.top, 62.5);
});

test('顶层页面有播放器 iframe 时不重复进入编辑模式', () => {
  assert.equal(shouldEnterEdit(true, true), false);
  assert.equal(shouldEnterEdit(true, false), true);
  assert.equal(shouldEnterEdit(false, true), true);
});

test('清除配置会恢复关闭状态、空选区和默认自动居中', () => {
  assert.deepEqual(defaultState(), { enabled: false, region: null, autoCenter: true });
});
