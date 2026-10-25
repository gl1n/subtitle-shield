chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-overlay' && command !== 'edit-overlay') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: command === 'edit-overlay' ? 'edit' : 'toggle' });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'broadcastToTab' || !message.tabId) return;
  chrome.webNavigation.getAllFrames({ tabId: message.tabId }).then(async frames => {
    await Promise.all(frames.map(async frame => {
      try {
        await chrome.tabs.sendMessage(message.tabId, message.payload, { frameId: frame.frameId });
      } catch {
        try {
          await chrome.scripting.executeScript({target:{tabId:message.tabId,frameIds:[frame.frameId]},files:['src/shared/overlay-utils.js','src/content/content.js']});
          await chrome.scripting.insertCSS({target:{tabId:message.tabId,frameIds:[frame.frameId]},files:['src/content/content.css']});
          await chrome.tabs.sendMessage(message.tabId, message.payload, { frameId: frame.frameId });
        } catch {}
      }
    }));
  });
  return true;
});
