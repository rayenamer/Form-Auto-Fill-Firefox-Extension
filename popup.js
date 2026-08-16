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
  'country', 'city', 'zip', 'dateOfBirth', 'nationality', 'gender', 'notes',
  'currentCompany', 'currentLocation', 'linkedinUrl', 'githubUrl', 'websiteUrl',
  'graduationYear', 'engineeringSchool', 'yearsOfExperience', 'howHeardAboutUs',
  'techStacks', 'motivationText', 'fitForRoleText'
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

// Document upload handler
document.getElementById('uploadDocBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('docUpload');
  const docNameInput = document.getElementById('docName');
  const file = fileInput.files[0];

  if (!file) {
    showStatus('docStatus', 'Please select a file first.', 'error');
    return;
  }

  // Check file size (max 5MB per file)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showStatus('docStatus', 'File too large (max 5MB). Please choose a smaller file.', 'error');
    return;
  }

  showStatus('docStatus', 'Uploading... please wait', 'success');

  const reader = new FileReader();
  
  reader.onerror = () => {
    showStatus('docStatus', 'Error reading file. Try again.', 'error');
  };

  reader.onload = (e) => {
    try {
      const fileData = {
        name: docNameInput.value || file.name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toLocaleString(),
        data: e.target.result // Base64 encoded
      };

      // Get existing documents
      browser.storage.local.get('documents', (result) => {
        try {
          const documents = result.documents || [];
          documents.push(fileData);

          // Check total storage size (Firefox allows ~10MB per extension)
          const totalSize = JSON.stringify(documents).length;
          if (totalSize > 8 * 1024 * 1024) {
            showStatus('docStatus', 'Storage full. Delete some documents first.', 'error');
            return;
          }

          browser.storage.local.set({ documents: documents }, () => {
            showStatus('docStatus', `Document "${fileData.name}" uploaded! ✓`, 'success');
            fileInput.value = '';
            docNameInput.value = '';
            loadDocuments();
          });
        } catch (err) {
          console.error('Storage error:', err);
          showStatus('docStatus', 'Storage error. Delete some documents.', 'error');
        }
      });
    } catch (err) {
      console.error('Upload error:', err);
      showStatus('docStatus', 'Upload failed. Try a different file.', 'error');
    }
  };

  reader.readAsDataURL(file);
});

// Load and display stored documents
function loadDocuments() {
  browser.storage.local.get('documents', (result) => {
    const documents = result.documents || [];
    const container = document.getElementById('docsContainer');

    if (documents.length === 0) {
      container.innerHTML = '<p style="color: #999; font-size: 12px;">No documents uploaded yet.</p>';
      return;
    }

    container.innerHTML = documents.map((doc, index) => `
      <div style="background: #f9f9f9; padding: 10px; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px;">📄 ${doc.name}</div>
        <div style="color: #666; margin-bottom: 4px;">
          Type: ${doc.fileType || 'Unknown'} | Size: ${(doc.fileSize / 1024).toFixed(2)} KB
        </div>
        <div style="color: #999; margin-bottom: 8px;">Uploaded: ${doc.uploadDate}</div>
        <div style="display: flex; gap: 5px;">
          <button class="doc-btn-download" data-index="${index}" style="flex: 1; padding: 5px; background: #0078d4; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Download</button>
          <button class="doc-btn-delete" data-index="${index}" style="flex: 1; padding: 5px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Delete</button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.doc-btn-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        downloadDocument(documents[index]);
      });
    });

    document.querySelectorAll('.doc-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        deleteDocument(index);
      });
    });
  });
}

// Download document
function downloadDocument(doc) {
  const link = document.createElement('a');
  link.href = doc.data;
  link.download = doc.fileName;
  link.click();
}

// Delete document
function deleteDocument(index) {
  browser.storage.local.get('documents', (result) => {
    const documents = result.documents || [];
    const docName = documents[index].name;

    if (confirm(`Delete "${docName}"?`)) {
      documents.splice(index, 1);
      browser.storage.local.set({ documents: documents }, () => {
        showStatus('docStatus', `Document deleted.`, 'success');
        loadDocuments();
      });
    }
  });
}

// Load data when popup opens
loadData();
loadDocuments();