# Form Auto-Fill Firefox Extension

Save your data once, auto-fill forms instantly.

## Installation

### Option 1: Developer Mode (Testing)
1. Save all files to a folder (e.g., `form-autofill-extension`)
2. Open Firefox
3. Go to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from your folder
6. Done! Extension is loaded.

**Note:** Temporary add-ons are removed when Firefox closes. Reload from about:debugging if needed.

### Option 2: Permanent Install (Production)
1. Create a ZIP file with all extension files
2. Rename to `.xpi` (Firefox extension format)
3. Open the `.xpi` file in Firefox
4. Click "Add" when prompted

### Option 3: Firefox Add-ons Store (Official)
1. Create Mozilla account
2. Submit extension to AMO (addons.mozilla.org)
3. Users can install from there

## How to Use

### First Time: Save Your Data
1. Click the extension icon in Firefox toolbar
2. Go to "Save Data" tab
3. Fill in your personal info:
   - First/Last Name
   - Email
   - Phone
   - Address
   - Country, City, Postal Code
   - Date of Birth
   - Any other info
4. Click "Save Data"
5. Your data is stored locally and securely

### One-Time: Add Your Gemini API Key
1. Get a free key at [aistudio.google.com](https://aistudio.google.com)
2. Click the extension icon → "Settings" tab
3. Paste your key, optionally click "Load Available Models" to pick a specific model
4. Click "Save Settings"

### Every Time: Fill a Form (AI-Powered)
1. Visit any form (job application, program registration, etc.)
2. Click the extension icon → "Fill Form" tab
3. **Step 1 — Detect:** click "Detect What This Form Needs" to scan the page's fields
4. **Step 2 — Match:** click "Match Fields with AI (Gemini)" — Gemini compares the detected fields against your saved data and proposes values
5. **Step 3 — Fill:** uncheck anything you don't want, then click "Fill Form"
6. Review the filled fields and submit manually

Prefer not to use AI? Click **"Quick Fill (offline, no AI)"** instead — it uses the built-in keyword-pattern matcher and never sends any data anywhere.

## Files

- `manifest.json` - Extension metadata
- `popup.html` - UI for saving data, settings, and triggering fills
- `popup.js` - Logic for popup, including the Gemini API calls
- `content.js` - Runs on web pages, detects and fills forms

## Features

✓ AI-powered field matching via Google Gemini — handles fields the keyword matcher can't (custom questions, unusual labels, dropdowns, radio groups)
✓ Offline fallback: smart keyword field matching (recognizes "email", "e-mail", "contact email" as the same) with no AI and no network calls
✓ Review step before filling — deselect any AI-proposed value you don't want
✓ Local storage only for your profile data and documents (data never leaves your computer unless you explicitly use the AI match step)
✓ Works on any form
✓ No tracking or ads

## Data Privacy

Your profile data, documents, and Gemini API key are stored locally in your Firefox browser using `browser.storage.local` and never sent to any server on their own.

**Exception:** when you click "Match Fields with AI (Gemini)", your saved profile data (not your uploaded documents) and the current page's form field labels/placeholders are sent to Google's Gemini API to compute the match. This only happens when you click that button. The "Quick Fill (offline)" button never sends any data anywhere.

## Troubleshooting

**Form not filling?**
- Make sure you've saved data first
- Some forms use JavaScript frameworks that may not work perfectly (rarely)
- Manually review filled fields before submitting

**"AI matching failed" or no matches?**
- Confirm your Gemini API key is saved in the Settings tab
- Click "Load Available Models" to verify the key works and pick a model your key supports
- Check that you've saved profile data first — the AI can only use what's stored
- File upload fields (e.g. CV) can never be auto-filled by any browser extension for security reasons; upload them manually from the Documents tab

**Data disappeared?**
- If you cleared browser data, extension data may be cleared too
- Always back up important info

**Extension icon missing?**
- Right-click toolbar → "Manage Extension" → Pin to toolbar

## License

MIT License — free to use, modify, and distribute.
