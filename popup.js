// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked tab
    document.getElementById(tabName).classList.add('active');
    e.target.classList.add('active');
  });
});

// Field IDs
const fieldIds = [
  'firstName', 'lastName', 'email', 'phone', 'address', 
  'country', 'city', 'zip', 'dateOfBirth', 'notes'
];

// Load saved data on popup open
function loadData() {
  browser.storage.local.get(fieldIds, (result) => {
    fieldIds.forEach(id => {
      const element = document.getElementById(id);
      if (element && result[id]) {
        element.value = result[id];
      }
    });
    updateDataSavedMessage();
  });
}

// Save data to storage
document.getElementById('saveBtn').addEventListener('click', () => {
  const data = {};
  fieldIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      data[id] = element.value;
    }
  });

  browser.storage.local.set(data, () => {
    showStatus('saveStatus', 'Data saved successfully! ✓', 'success');
    updateDataSavedMessage();
  });
});

// Clear all data
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Are you sure? This will clear all saved data.')) {
    fieldIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = '';
      }
    });
    browser.storage.local.clear(() => {
      showStatus('saveStatus', 'All data cleared.', 'success');
      updateDataSavedMessage();
    });
  }
});

// Fill form on current page
document.getElementById('fillBtn').addEventListener('click', () => {
  // Get saved data
  browser.storage.local.get(fieldIds, (data) => {
    // Send message to content script
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      browser.tabs.sendMessage(tabs[0].id, {
        action: 'fillForm',
        data: data
      }, (response) => {
        if (response) {
          showStatus('fillStatus', `Filled ${response.filled} fields! ✓`, 'success');
          document.getElementById('fillResults').innerHTML = `
            <strong>Fields filled:</strong><br>
            ${response.details.join('<br>')}
          `;
        } else {
          showStatus('fillStatus', 'No form fields found on this page.', 'error');
        }
      });
    });
  });
});

// Show status message
function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `status-message ${type}`;
  
  setTimeout(() => {
    element.className = 'status-message';
  }, 4000);
}

// Update "data saved" indicator
function updateDataSavedMessage() {
  browser.storage.local.get(fieldIds, (result) => {
    const saved = fieldIds.filter(id => result[id] && result[id].trim() !== '');
    const element = document.getElementById('dataSaved');
    
    if (saved.length > 0) {
      element.textContent = `✓ ${saved.length} fields saved`;
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  });
}

// Load data when popup opens
loadData();
