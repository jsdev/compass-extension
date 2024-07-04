chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkContrast") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: scanDOM
      });
    });
  }
});
