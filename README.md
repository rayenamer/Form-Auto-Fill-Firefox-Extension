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

### Every Time: Fill a Form
1. Visit any form (job application, program registration, etc.)
2. Click the extension icon
3. Go to "Fill Form" tab
4. Click "Fill Form on This Page"
5. Extension auto-detects form fields and fills with your saved data
6. Review the results and submit manually

## Files

- `manifest.json` - Extension metadata
- `popup.html` - UI for saving data and triggering fills
- `popup.js` - Logic for popup
- `content.js` - Runs on web pages, detects and fills forms

## Features

✓ Smart field matching (recognizes "email", "e-mail", "contact email" as the same)
✓ Local storage only (data never leaves your computer)
✓ Works on any form
✓ No tracking or ads
✓ One-click fill

## Data Privacy

All data is stored locally in your Firefox browser using `browser.storage.local`. Nothing is sent to servers. You can clear data anytime.

## Troubleshooting

**Form not filling?**
- Make sure you've saved data first
- Some forms use JavaScript frameworks that may not work perfectly (rarely)
- Manually review filled fields before submitting

**Data disappeared?**
- If you cleared browser data, extension data may be cleared too
- Always back up important info

**Extension icon missing?**
- Right-click toolbar → "Manage Extension" → Pin to toolbar

## License

Free to use and modify.
# Form-Auto-Fill-Firefox-Extension
