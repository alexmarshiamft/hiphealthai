chrome.action.onClicked.addListener(async (tab) => {
  // Read the latest copied note from the clipboard (requires clipboardWrite permission)
  // Wait, reading clipboard in background script in MV3 is not allowed directly without offscreen document, 
  // but we can execute a script in the active tab to read from clipboard or just trigger the content script to paste.
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send a message to the content script to initiate the paste
    chrome.tabs.sendMessage(tab.id, { action: 'INJECT_NOTE' });
  } catch (err) {
    console.error("Failed to inject script:", err);
  }
});
