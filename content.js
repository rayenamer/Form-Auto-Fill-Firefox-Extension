// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillForm') {
    const result = fillForm(message.data);
    sendResponse(result);
  }
});

// Smart field matching
function matchFieldToData(fieldName, fieldType, fieldPlaceholder, fieldLabel) {
  const name = (fieldName + fieldPlaceholder + fieldLabel).toLowerCase();
  
  const patterns = {
    firstName: ['first name', 'first_name', 'fname', 'given', 'forename'],
    lastName: ['last name', 'last_name', 'lname', 'surname', 'family'],
    email: ['email', 'e-mail', 'mail', 'contact email', 'email address'],
    phone: ['phone', 'telephone', 'mobile', 'cell', 'number', 'contact number'],
    address: ['address', 'street', 'full address'],
    country: ['country', 'nation'],
    city: ['city', 'town', 'locality'],
    zip: ['zip', 'postal code', 'postcode', 'post code', 'code postal'],
    dateOfBirth: ['date of birth', 'dob', 'birth date', 'birthdate', 'born'],
    notes: ['notes', 'comment', 'description', 'message']
  };

  for (const [key, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return key;
    }
  }

  // Fallback: match by input type
  if (fieldType === 'email') return 'email';
  if (fieldType === 'tel') return 'phone';

  return null;
}

// Get all visible input fields
function getFormFields() {
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea');
  const fields = [];

  inputs.forEach(input => {
    // Skip if hidden or not visible
    if (!input.offsetParent) return;

    const fieldName = (input.name || '').toLowerCase();
    const fieldType = (input.type || '').toLowerCase();
    const fieldPlaceholder = (input.placeholder || '').toLowerCase();
    const fieldLabel = (input.getAttribute('aria-label') || '').toLowerCase();

    const match = matchFieldToData(fieldName, fieldType, fieldPlaceholder, fieldLabel);

    if (match) {
      fields.push({
        element: input,
        matchType: match,
        name: fieldName,
        type: fieldType
      });
    }
  });

  return fields;
}

// Fill the form
function fillForm(data) {
  const fields = getFormFields();
  const filled = [];
  const details = [];

  fields.forEach(field => {
    const value = data[field.matchType];

    if (value && value.trim() !== '') {
      // Scroll into view
      field.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Set value
      field.element.value = value;

      // Trigger change events for frameworks like React/Vue
      field.element.dispatchEvent(new Event('input', { bubbles: true }));
      field.element.dispatchEvent(new Event('change', { bubbles: true }));
      field.element.dispatchEvent(new Event('blur', { bubbles: true }));

      filled.push(field.matchType);
      details.push(`✓ ${field.name || field.matchType}`);
    }
  });

  return {
    filled: filled.length,
    details: details.length > 0 ? details : ['No matching fields found']
  };
}
