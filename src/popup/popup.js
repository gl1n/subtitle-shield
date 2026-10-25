const $ = id => document.getElementById(id);
let tabId;
let activeFrameId;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  return tab;
}

async function sendToFrames(payload) {
  if (!tabId) return;
  await chrome.runtime.sendMessage({
    type: 'broadcastToTab',
    tabId,
    payload,
  });
}

async function init() {
  if (!(await activeTab())?.id) return;
  const result = await chrome.runtime.sendMessage({ type: 'getStateFromTab', tabId });
  if (!result) return;
  activeFrameId = result.frameId;
  const state = result.state;
  $('enabled').checked = state.enabled;
  $('autoCenter').checked = !!state.autoCenter;
  $('edit').textContent = state.hasRegion ? '调整遮挡区域' : '选择遮挡区域';
  $('status').textContent = state.hasRegion ? '当前网站已有遮挡配置' : '尚未设置遮挡区域';
}

$('enabled').onchange = () => sendToFrames({ type: 'setEnabled', enabled: $('enabled').checked });
$('autoCenter').onchange = () => sendToFrames({ type: 'setAutoCenter', enabled: $('autoCenter').checked });
$('edit').onclick = async () => {
  await sendToFrames({ type: 'edit' });
  window.close();
};
$('clear').onclick = async () => {
  await chrome.runtime.sendMessage({ type: 'broadcastToTab', tabId, payload: { type: 'clear' } });
  $('enabled').checked = false;
  $('status').textContent = '配置已清除';
};

init();
