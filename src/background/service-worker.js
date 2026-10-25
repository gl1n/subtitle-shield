importScripts('../shared/frame-state-utils.js');

async function sendToFrame(tabId, frameId, payload) {
  try {
    return await chrome.tabs.sendMessage(tabId, payload, { frameId });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        files: ['src/shared/overlay-utils.js', 'src/content/content.js'],
      });
      await chrome.scripting.insertCSS({
        target: { tabId, frameIds: [frameId] },
        files: ['src/content/content.css'],
      });
      return await chrome.tabs.sendMessage(tabId, payload, { frameId });
    } catch {
      return null;
    }
  }
}

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-overlay' && command !== 'edit-overlay') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: command === 'edit-overlay' ? 'edit' : 'toggle' });
});

chrome.runtime.onMessage.addListener((message, _, reply) => {
  if (message.type === 'getStateFromTab' && message.tabId) {
    chrome.webNavigation.getAllFrames({ tabId: message.tabId }).then(async frames => {
      const entries = await Promise.all(frames.map(async frame => ({
        frameId: frame.frameId,
        state: await sendToFrame(message.tabId, frame.frameId, { type: 'getState' }),
      })));
      reply(DmShieldFrameState.selectFrameState(entries));
    });
    return true;
  }

  if (message.type !== 'broadcastToTab' || !message.tabId) return;
  const framesPromise = Number.isInteger(message.frameId)
    ? Promise.resolve([{ frameId: message.frameId }])
    : chrome.webNavigation.getAllFrames({ tabId: message.tabId });
  framesPromise.then(frames => Promise.all(
    frames.map(frame => sendToFrame(message.tabId, frame.frameId, message.payload)),
  ));
});
