// Function to safely access chrome storage API
function safeStorageSet(data) {
  try {
    chrome.storage.local.set(data);
  } catch (e) {
    console.log('Storage access error:', e);
  }
}

function safeStorageGet(keys, callback) {
  try {
    chrome.storage.local.get(keys, callback);
  } catch (e) {
    console.log('Storage access error:', e);
    callback({});
  }
}

// Initialize extension settings when installed
chrome.runtime.onInstalled.addListener(function() {
  console.log('Grid Resizer extension installed or updated');
  
  // Set default settings if not already set
  safeStorageGet(['gridSize', 'sliderVisible'], function(result) {
    const defaults = {};
    
    if (result.gridSize === undefined) {
      defaults.gridSize = 260;
    }
    
    if (result.sliderVisible === undefined) {
      defaults.sliderVisible = true;
    }
    
    if (Object.keys(defaults).length > 0) {
      safeStorageSet(defaults);
    }
  });
});

// Handle extension icon clicks - toggle slider visibility
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.url && tab.url.includes('are.na')) {
    // Query for the current tab status
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
          const activeTab = tabs[0];
          
          safeStorageGet(['sliderVisible'], function(result) {
            // Toggle visibility
            const isVisible = !(result.sliderVisible || false);
            
            // Save new state
            safeStorageSet({sliderVisible: isVisible});
            
            // Send message to content script
            try {
              chrome.tabs.sendMessage(activeTab.id, {
                action: 'toggleSlider',
                visible: isVisible
              }).catch(error => {
                console.log('Error sending message to content script:', error);
              });
            } catch (error) {
              console.log('Error sending message:', error);
            }
          });
        }
      });
    } catch (error) {
      console.log('Error querying tabs:', error);
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    safeStorageGet(['isActive'], function(result) {
      try {
        sendResponse({ isActive: result.isActive || false });
      } catch (e) {
        console.log('Error sending response:', e);
      }
    });
    return true; // Required for asynchronous sendResponse
  }
}); 