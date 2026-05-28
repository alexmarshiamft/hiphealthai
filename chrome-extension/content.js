// content.js — Direct DOM injector for EHR textareas and contenteditable fields

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'EXECUTE_INJECTION') {
    try {
      const injectionText = message.text;
      
      if (!injectionText || injectionText.trim() === '') {
        alert("Hip Health Secure Scribe: Nothing to inject. Please compile a SOAP note first.");
        return;
      }

      // Find the active focused element on the EHR page
      const activeEl = document.activeElement;

      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' || activeEl.isContentEditable)) {
        
        // Handle Standard Textarea or Input field
        if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
          const start = activeEl.selectionStart || 0;
          const end = activeEl.selectionEnd || 0;
          const originalVal = activeEl.value;
          
          activeEl.value = originalVal.substring(0, start) + injectionText + originalVal.substring(end);
          
          // Trigger standard React/Angular input change events
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
          activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        } 
        // Handle Rich Text contenteditable elements (Draft.js, Quill, custom EHR editors)
        else if (activeEl.isContentEditable) {
          activeEl.focus();
          
          // Try execCommand first (highest compatibility with text editors for cursor placement)
          try {
            document.execCommand('insertText', false, injectionText);
          } catch (e) {
            // Fallback to direct innerText modification
            activeEl.innerText = injectionText;
          }
          
          activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Apply a premium, soft green glow flash to show visual feedback in the EHR
        const originalBg = activeEl.style.backgroundColor;
        activeEl.style.transition = 'background-color 0.4s ease';
        activeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        
        setTimeout(() => {
          activeEl.style.backgroundColor = originalBg;
        }, 800);

      } else {
        alert("Hip Health Secure Scribe: Please click inside your EHR note text area first, then click 'Inject SOAP Note' in the extension.");
      }
    } catch (err) {
      console.error("Direct injection failure:", err);
      alert("Hip Health Injection Error: " + err.message);
    }
  }
});
