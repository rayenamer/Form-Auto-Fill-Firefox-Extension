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

// Quick Fill (offline, pattern-based) on current page
document.getElementById('quickFillBtn').addEventListener('click', () => {
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

// ---- AI-assisted flow: Detect -> Match with Gemini -> Fill ----

let detectedFields = [];
let matchedFields = []; // [{uid, value, label}]

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Step 1: Detect form fields on the active tab
document.getElementById('detectBtn').addEventListener('click', () => {
  matchedFields = [];
  document.getElementById('matchResults').innerHTML = '';
  document.getElementById('fillResults').innerHTML = '';
  document.getElementById('matchBtn').disabled = true;
  document.getElementById('fillBtn').disabled = true;

  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { action: 'detectFields' }, (response) => {
      if (!response || response.count === 0) {
        showStatus('fillStatus', 'No fillable fields found on this page.', 'error');
        document.getElementById('detectResults').innerHTML = '';
        return;
      }
      detectedFields = response.fields;
      showStatus('fillStatus', `Detected ${response.count} field(s). ✓`, 'success');
      document.getElementById('detectResults').innerHTML =
        `<div class="data-saved">Found: ${detectedFields.map(f => escapeHtml(f.label || f.name || f.uid)).join(', ')}</div>`;
      document.getElementById('matchBtn').disabled = false;
    });
  });
});

// Step 2: Send detected fields + stored profile data to Gemini, get back matches
document.getElementById('matchBtn').addEventListener('click', () => {
  browser.storage.local.get(null, (stored) => {
    const { geminiApiKey, geminiModel } = stored;

    if (!geminiApiKey) {
      showStatus('fillStatus', 'Set your Gemini API key in the Settings tab first.', 'error');
      return;
    }
    if (detectedFields.length === 0) {
      showStatus('fillStatus', 'Run "Detect What This Form Needs" first.', 'error');
      return;
    }

    const profile = {};
    fieldIds.forEach(id => {
      if (stored[id] && String(stored[id]).trim() !== '') profile[id] = stored[id];
    });
    if (stored.documents && stored.documents.length > 0) {
      profile.storedDocumentNames = stored.documents.map(d => d.name);
    }

    document.getElementById('matchBtn').disabled = true;
    document.getElementById('matchResults').innerHTML = '<div class="data-saved">Asking Gemini to match fields...</div>';
    showStatus('fillStatus', 'Contacting Gemini...', 'success');

    matchFieldsWithGemini(geminiApiKey, geminiModel || 'gemini-3.6-flash', profile, detectedFields)
      .then(matches => {
        matchedFields = matches.map(m => {
          const field = detectedFields.find(f => f.uid === m.uid);
          return { uid: m.uid, value: m.value, label: field ? field.label : m.uid };
        }).filter(m => m.value !== undefined && m.value !== null && String(m.value).trim() !== '');

        if (matchedFields.length === 0) {
          showStatus('fillStatus', 'AI could not confidently match any fields.', 'error');
          document.getElementById('matchResults').innerHTML = '';
          document.getElementById('matchBtn').disabled = false;
          return;
        }

        showStatus('fillStatus', `AI matched ${matchedFields.length} field(s). ✓`, 'success');
        document.getElementById('matchResults').innerHTML = matchedFields.map((m, i) => `
          <div class="field-row">
            <input type="checkbox" class="match-check" data-index="${i}" checked>
            <label>
              <span class="field-label">${escapeHtml(m.label)}</span>
              <span class="field-value">${escapeHtml(m.value)}</span>
            </label>
          </div>
        `).join('');
        document.getElementById('matchBtn').disabled = false;
        document.getElementById('fillBtn').disabled = false;
      })
      .catch(err => {
        console.error('Gemini match error:', err);
        showStatus('fillStatus', `AI matching failed: ${err.message}`, 'error');
        document.getElementById('matchResults').innerHTML = '';
        document.getElementById('matchBtn').disabled = false;
      });
  });
});

// Step 3: Fill the form with the (checked) AI-matched values
document.getElementById('fillBtn').addEventListener('click', () => {
  const checks = document.querySelectorAll('.match-check');
  const selected = matchedFields.filter((_, i) => checks[i] && checks[i].checked);

  if (selected.length === 0) {
    showStatus('fillStatus', 'No fields selected to fill.', 'error');
    return;
  }

  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {
      action: 'fillDetectedFields',
      matches: selected
    }, (response) => {
      if (response) {
        showStatus('fillStatus', `Filled ${response.filled} field(s)! ✓`, 'success');
        document.getElementById('fillResults').innerHTML = `
          <strong>Fields filled:</strong><br>
          ${response.details.join('<br>')}
        `;
      } else {
        showStatus('fillStatus', 'Could not fill the form.', 'error');
      }
    });
  });
});

// Calls the Gemini API to match detected form fields to the user's stored profile data.
// Returns a promise resolving to [{uid, value}, ...]
async function matchFieldsWithGemini(apiKey, model, profile, fields) {
  const prompt = `You are a form-filling assistant. Given a user's stored profile data and a list of fields detected on a web form, decide which fields can be confidently filled from the profile data, and with what value.

Rules:
- Only include a field in "matches" if you are reasonably confident about the value based on the profile data.
- For fields of type "select" or "radio-group", the "value" you return MUST exactly equal one of that field's provided option "value" strings.
- For fields of type "checkbox", return "value": "true" only if the checkbox should be checked based on the profile; omit the field entirely otherwise.
- For text/textarea/email/tel/url/date fields, return the value as plain text to type into the field.
- Do not invent information that is not present in the profile data.
- Respond using only the JSON schema provided.

Profile data (JSON):
${JSON.stringify(profile)}

Detected form fields (JSON):
${JSON.stringify(fields)}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          matches: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                uid: { type: 'STRING' },
                value: { type: 'STRING' }
              },
              required: ['uid', 'value']
            }
          }
        },
        required: ['matches']
      }
    }
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      message = JSON.parse(errText).error?.message || message;
    } catch (e) { /* keep default message */ }
    throw new Error(message);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini.');

  const parsed = JSON.parse(text);
  return parsed.matches || [];
}

// ---- Settings tab: Gemini API key + model ----

function loadSettings() {
  browser.storage.local.get(['geminiApiKey', 'geminiModel'], (result) => {
    if (result.geminiApiKey) document.getElementById('geminiApiKey').value = result.geminiApiKey;
    if (result.geminiModel) {
      const select = document.getElementById('geminiModel');
      if (![...select.options].some(o => o.value === result.geminiModel)) {
        const opt = document.createElement('option');
        opt.value = result.geminiModel;
        opt.textContent = result.geminiModel;
        select.appendChild(opt);
      }
      select.value = result.geminiModel;
    }
  });
}

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const geminiApiKey = document.getElementById('geminiApiKey').value.trim();
  const geminiModel = document.getElementById('geminiModel').value;

  browser.storage.local.set({ geminiApiKey, geminiModel }, () => {
    showStatus('settingsStatus', 'Settings saved. ✓', 'success');
  });
});

document.getElementById('loadModelsBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('geminiApiKey').value.trim();
  if (!apiKey) {
    showStatus('settingsStatus', 'Enter your API key first.', 'error');
    return;
  }

  showStatus('settingsStatus', 'Loading available models...', 'success');

  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      const models = (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      if (models.length === 0) {
        showStatus('settingsStatus', 'No compatible models found for this key.', 'error');
        return;
      }

      const select = document.getElementById('geminiModel');
      const current = select.value;
      select.innerHTML = models.map(id => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('');
      if (models.includes(current)) select.value = current;

      showStatus('settingsStatus', `Loaded ${models.length} model(s). ✓`, 'success');
    })
    .catch(err => {
      console.error('Model list error:', err);
      showStatus('settingsStatus', `Could not load models: ${err.message}`, 'error');
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
loadSettings();