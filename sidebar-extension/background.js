// background.js — Toggles the injected sidebar in the active tab DOM

chrome.action.onClicked.addListener(async (tab) => {
  // Prevent executing on internal chrome:// pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }

  try {
    // Attempt to send a message to check if content script is active
    await chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_SIDEBAR' });
  } catch (err) {
    // If message fails, inject the content script first
    console.log("Content script not detected. Injecting content.js into tab...", tab.id);
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Resend the toggle message once injected
      await chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_SIDEBAR' });
    } catch (injectErr) {
      console.error("Failed to inject content script:", injectErr);
    }
  }
});
