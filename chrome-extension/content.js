chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'INJECT_NOTE') {
    try {
      // 1. Read from the system clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText || clipboardText.trim() === '') {
        alert("Hip Health Extension: Clipboard is empty. Please copy a note from the dashboard first.");
        return;
      }

      // 2. Find the active element (the one the user currently clicked on / focused)
      const activeEl = document.activeElement;

      // 3. Inject if it's a valid input area
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        
        // Handle standard textarea
        if (activeEl.tagName === 'TEXTAREA') {
          const start = activeEl.selectionStart;
          const end = activeEl.selectionEnd;
          const text = activeEl.value;
          activeEl.value = text.substring(0, start) + clipboardText + text.substring(end);
          
          // Trigger React/Angular input events if the EHR uses a framework
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
          activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        } 
        // Handle contenteditable (like Draft.js, Quill, or custom EHR inputs)
        else if (activeEl.isContentEditable) {
          // If we can use execCommand (deprecated but works best for rich text editors)
          if (!document.execCommand('insertText', false, clipboardText)) {
            // Fallback
            activeEl.innerText += clipboardText;
          }
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Show visual feedback
        const originalBg = activeEl.style.backgroundColor;
        activeEl.style.transition = 'background-color 0.5s';
        activeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; // Green flash
        setTimeout(() => {
          activeEl.style.backgroundColor = originalBg;
        }, 1000);

      } else {
        alert("Hip Health Extension: Please click inside a text box first, then click the extension icon.");
      }
    } catch (err) {
      console.error("Failed to read clipboard or inject:", err);
      alert("Hip Health Extension Error: " + err.message);
    }
  }
});
