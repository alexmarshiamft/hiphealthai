// background.js — Manifest V3 service worker for Hip Health Secure AI Scribe

// Enable the Side Panel behavior when clicking the extension icon
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Error setting panel behavior:", error));
});

// Listener for direct injection commands from popup/side panel to content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'INJECT_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length === 0) return;
      const activeTab = tabs[0];
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
        
        chrome.tabs.sendMessage(activeTab.id, { 
          action: 'EXECUTE_INJECTION', 
          text: message.text 
        });
      } catch (err) {
        console.error("Failed to inject script:", err);
      }
    });
  }
});
