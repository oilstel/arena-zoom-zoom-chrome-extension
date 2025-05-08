// Store the current grid size in a variable
let currentGridSize = 260;
let isUpdating = false;
let debounceTimer = null;
let sliderVisible = true;

// Function to safely access chrome storage API
function safeStorageSet(data) {
  try {
    chrome.storage.local.set(data);
  } catch (e) {
    console.log('Storage access error:', e);
  }
}

// Create the slider toggle button
function createToggleButton() {
  const toggle = document.createElement('div');
  toggle.id = 'arena-grid-toggle';
  toggle.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 17px;
    height: 17px;
    background: white;
    border-radius: 50%;
    border: 1px solid #000;
    z-index: 9999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  `;
  
  // Remove the grid icon emoji
  toggle.innerHTML = '';
  
  // Add click handler
  toggle.addEventListener('click', function() {
    toggleSliderVisibility();
  });
  
  document.body.appendChild(toggle);
  return toggle;
}

// Function to toggle slider visibility
function toggleSliderVisibility() {
  const slider = document.getElementById('arena-grid-resizer');
  if (slider) {
    // Toggle visibility
    sliderVisible = !sliderVisible;
    slider.style.display = sliderVisible ? 'flex' : 'none';
    
    // Save preference
    safeStorageSet({ sliderVisible: sliderVisible });
    
    // Rotate toggle icon
    const toggle = document.getElementById('arena-grid-toggle');
    if (toggle) {
      toggle.style.transform = sliderVisible ? 'rotate(45deg)' : 'rotate(0deg)';
    }
  } else {
    // Create slider if it doesn't exist
    createOnPageUI();
    sliderVisible = true;
    safeStorageSet({ sliderVisible: true });
    
    // Update toggle icon
    const toggle = document.getElementById('arena-grid-toggle');
    if (toggle) {
      toggle.style.transform = 'rotate(45deg)';
    }
  }
}

// Create simplified in-page slider
function createOnPageUI() {
  // Create the slider container
  const container = document.createElement('div');
  container.id = 'arena-grid-resizer';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 50px;
    background: white;
    border-radius: 3px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    padding: 6px 10px;
    z-index: 9998;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    display: ${sliderVisible ? 'flex' : 'none'};
    align-items: center;
    width: 240px;
  `;
  
  // Add slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '50';
  slider.max = '500';
  slider.value = currentGridSize;
  slider.style.cssText = `
    flex: 1;
    margin-right: 8px;
  `;
  
  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = '↺';
  resetButton.title = 'Reset to default size';
  resetButton.style.cssText = `
    border-radius: 50%;
    border: none;
    color: #000;
    background: #fff;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0;
  `;
  
  // Assemble UI
  container.appendChild(slider);
  container.appendChild(resetButton);
  document.body.appendChild(container);
  
  // Default grid size constant
  const DEFAULT_GRID_SIZE = 260;
  
  // Add event listener for slider
  slider.addEventListener('input', function() {
    const size = parseInt(this.value, 10);
    currentGridSize = size;
    applyGridSize(size);
    saveGridSize(size);
  });
  
  // Add event listener for reset button
  resetButton.addEventListener('click', function() {
    slider.value = DEFAULT_GRID_SIZE;
    currentGridSize = DEFAULT_GRID_SIZE;
    applyGridSize(DEFAULT_GRID_SIZE);
    saveGridSize(DEFAULT_GRID_SIZE);
  });
  
  // Return slider for reference
  return { container, slider };
}

// Function to apply grid size
function applyGridSize(size = 260) {
  // Ensure size is a number
  size = parseInt(size, 10);
  
  if (isUpdating) return;
  isUpdating = true;
  
  // Calculate gap size proportionally to grid size
  // Start with 16px at max size (500px) down to 4px at min size (10px)
  const maxGap = 16;
  const minGap = 4;
  const maxSize = 500;
  const minSize = 50;
  
  const gapSize = Math.max(
    minGap,
    Math.round(minGap + ((size - minSize) / (maxSize - minSize)) * (maxGap - minGap))
  );
  
  // Calculate font size proportionally to grid size
  // Start with 16px at max size (500px) down to 10px at min size (50px)
  const maxFontSize = 16;
  const minFontSize = 8;
  
  const fontSize = Math.max(
    minFontSize,
    Math.round(minFontSize + ((size - minSize) / (maxSize - minSize)) * (maxFontSize - minFontSize))
  );
  
  const gridElements = document.querySelectorAll('.virtuoso-grid-list');
  gridElements.forEach(grid => {
    grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
  });
  
  // Adjust row and column gap
  const gridLists = document.querySelectorAll('.virtuoso-grid-list, .virtuoso-item-list');
  gridLists.forEach(list => {
    list.style.columnGap = `${gapSize}px`;
    list.style.rowGap = `${gapSize}px`;
  });
  
  // Adjust text size in grid items
  const gridItems = document.querySelectorAll('.virtuoso-grid-item *');
  gridItems.forEach(item => {
    item.style.fontSize = `${fontSize}px`;
  });
  
  isUpdating = false;
  
  // Update UI if it exists
  updateUIFromSize(size);
}

// Function to save grid size to storage
function saveGridSize(size) {
  safeStorageSet({ gridSize: size });
}

// Function to update UI elements from size
function updateUIFromSize(size) {
  // Find UI elements if they exist
  const slider = document.querySelector('#arena-grid-resizer input[type="range"]');
  
  // Update if they exist
  if (slider) slider.value = size;
}

// Initialize
function initialize() {
  // Get stored settings
  try {
    chrome.storage.local.get(['gridSize', 'sliderVisible'], function(result) {
      currentGridSize = result.gridSize || 260;
      sliderVisible = result.sliderVisible !== undefined ? result.sliderVisible : true;
      
      // Apply grid size
      applyGridSize(currentGridSize);
      
      // Create toggle button
      const toggle = createToggleButton();
      
      // Create slider UI
      const ui = createOnPageUI();
      
      // Set initial toggle rotation
      if (toggle) {
        toggle.style.transform = sliderVisible ? 'rotate(45deg)' : 'rotate(0deg)';
      }
      
      // Update UI with current size
      updateUIFromSize(currentGridSize);
    });
  } catch (e) {
    console.log('Storage access error:', e);
    // Continue with defaults
    currentGridSize = 260;
    sliderVisible = true;
    applyGridSize(currentGridSize);
    createToggleButton();
    createOnPageUI();
  }
  
  // Set up observer for DOM changes
  const observer = new MutationObserver((mutations) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      applyGridSize(currentGridSize);
    }, 100);
  });
  
  // Start observing the document
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Listen for messages from extension
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'toggleSlider') {
        sliderVisible = message.visible;
        
        const slider = document.getElementById('arena-grid-resizer');
        if (slider) {
          slider.style.display = sliderVisible ? 'flex' : 'none';
        }
        
        const toggle = document.getElementById('arena-grid-toggle');
        if (toggle) {
          toggle.style.transform = sliderVisible ? 'rotate(45deg)' : 'rotate(0deg)';
        }
        
        // Send response
        if (sendResponse) {
          try {
            sendResponse({success: true});
          } catch (e) {
            console.log('Error sending response:', e);
          }
        }
      }
      return true;
    });
  } catch (e) {
    console.log('Error setting up message listener:', e);
  }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM already loaded, run now
  initialize();
} 