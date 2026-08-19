// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillForm') {
    const result = fillForm(message.data);
    sendResponse(result);
  } else if (message.action === 'detectFields') {
    const result = detectFields();
    sendResponse(result);
  } else if (message.action === 'fillDetectedFields') {
    const result = fillDetectedFields(message.matches);
    sendResponse(result);
  }
});

// Smart field matching - Multiple languages
function matchFieldToData(fieldName, fieldType, fieldPlaceholder, fieldLabel) {
  const name = (fieldName + fieldPlaceholder + fieldLabel).toLowerCase();
  
  const patterns = {
    firstName: [
      // English
      'first name', 'first_name', 'fname', 'given', 'forename',
      // French
      'prenom', 'prénom', 'first_name_fr',
      // Spanish
      'nombre', 'primer nombre',
      // German
      'vorname', 'first name',
      // Italian
      'nome', 'primo nome',
      // Arabic
      'الاسم الأول', 'first name ar',
      // Portuguese
      'primeiro nome'
    ],
    lastName: [
      // English
      'last name', 'last_name', 'lname', 'surname', 'family', 'family name',
      // French
      'nom', 'nom de famille', 'last_name_fr',
      // Spanish
      'apellido', 'last name',
      // German
      'nachname', 'familienname',
      // Italian
      'cognome', 'surname',
      // Arabic
      'الاسم الأخير', 'last name ar',
      // Portuguese
      'sobrenome'
    ],
    email: [
      // English
      'email', 'e-mail', 'mail', 'contact email', 'email address', 'electronic mail',
      // French
      'email', 'e-mail', 'courriel', 'adresse email',
      // Spanish
      'email', 'correo', 'correo electrónico',
      // German
      'email', 'e-mail', 'emailadresse',
      // Italian
      'email', 'posta elettronica',
      // Arabic
      'البريد الإلكتروني', 'email ar',
      // Portuguese
      'email', 'endereço de email'
    ],
    phone: [
      // English
      'phone', 'telephone', 'mobile', 'cell', 'number', 'contact number', 'tel', 'mobile number',
      // French
      'téléphone', 'telephone', 'portable', 'numero', 'numéro',
      // Spanish
      'teléfono', 'telefono', 'móvil', 'celular', 'numero',
      // German
      'telefon', 'mobile', 'handy', 'nummer',
      // Italian
      'telefono', 'cellulare', 'numero',
      // Arabic
      'رقم الهاتف', 'phone ar', 'جوال',
      // Portuguese
      'telefone', 'celular', 'número'
    ],
    address: [
      // English
      'address', 'street', 'full address', 'street address', 'home address',
      // French
      'adresse', 'rue', 'adresse complète',
      // Spanish
      'dirección', 'calle', 'domicilio',
      // German
      'adresse', 'straße', 'strasse',
      // Italian
      'indirizzo', 'via', 'strada',
      // Arabic
      'العنوان', 'address ar',
      // Portuguese
      'endereço', 'rua'
    ],
    country: [
      // English
      'country', 'nation', 'country name',
      // French
      'pays', 'nation',
      // Spanish
      'país', 'pais', 'nación',
      // German
      'land', 'staat',
      // Italian
      'paese', 'nazione',
      // Arabic
      'الدولة', 'country ar',
      // Portuguese
      'país', 'pais'
    ],
    city: [
      // English
      'city', 'town', 'locality', 'city name',
      // French
      'ville', 'commune', 'localité',
      // Spanish
      'ciudad', 'pueblo',
      // German
      'stadt', 'ort',
      // Italian
      'città', 'comune',
      // Arabic
      'المدينة', 'city ar',
      // Portuguese
      'cidade', 'município'
    ],
    zip: [
      // English
      'zip', 'postal code', 'postcode', 'post code', 'zipcode', 'zip code',
      // French
      'code postal', 'zip',
      // Spanish
      'código postal', 'cp', 'codigo',
      // German
      'postleitzahl', 'plz', 'zip',
      // Italian
      'codice postale', 'cap',
      // Arabic
      'الرمز البريدي', 'zip ar',
      // Portuguese
      'código postal', 'cep'
    ],
    dateOfBirth: [
      // English
      'date of birth', 'dob', 'birth date', 'birthdate', 'born', 'date birth', 'birthday',
      // French
      'date de naissance', 'date naissance', 'naissance', 'dob',
      // Spanish
      'fecha de nacimiento', 'fecha nac', 'nacimiento',
      // German
      'geburtsdatum', 'geburtstag', 'dob',
      // Italian
      'data di nascita', 'nascita',
      // Arabic
      'تاريخ الميلاد', 'dob ar',
      // Portuguese
      'data de nascimento', 'nascimento'
    ],
    nationality: [
      'nationality', 'nationalité', 'nacionalidad', 'nationalität', 'nazionalità', 'الجنسية', 'nacionalidade'
    ],
    gender: [
      'gender', 'sex', 'sexe', 'sexo', 'geschlecht', 'genere', 'الجنس', 'gênero', 'genre', 'tu es', 'tu es homme'
    ],
    currentCompany: [
      // English
      'current company', 'company', 'employer', 'current employer', 'where you work',
      // French
      'entreprise actuelle', 'entreprise', 'employeur',
      // Spanish
      'empresa actual', 'empresa', 'empleador'
    ],
    currentLocation: [
      // English
      'current location', 'current city', 'where you live', 'location', 'where are you',
      // French
      'localisation actuelle', 'lieu actuel', 'où habites',
      // Spanish
      'ubicación actual', 'dónde vives'
    ],
    linkedinUrl: [
      'linkedin', 'linkedin url', 'linkedin profile', 'linkedin link', 'profil linkedin',
      'profil linkedin', 'perfil linkedin'
    ],
    githubUrl: [
      'github', 'github url', 'github profile', 'github link', 'profil github', 'perfil github'
    ],
    websiteUrl: [
      'website', 'portfolio', 'personal website', 'your website', 'website url',
      'site web', 'portfolio url', 'sitio web'
    ],
    graduationYear: [
      // English
      'graduation year', 'grad year', 'year of graduation', 'when will you graduate', 'when did you graduate',
      // French
      'année de diplomation', 'année diplôme', 'diplômé', 'en quelle année',
      // Spanish
      'año de graduación', 'año graduación'
    ],
    engineeringSchool: [
      // English
      'school', 'engineering school', 'university', 'studied', 'education',
      // French
      'école', 'école d\'ingénieur', 'école ingénieur', 'université', 'dans quelle école',
      // Spanish
      'escuela', 'universidad', 'colegio'
    ],
    yearsOfExperience: [
      // English
      'years of experience', 'experience', 'years exp', 'professional experience', 'work experience',
      'combien d\'années', 'combien d\'années d\'expérience',
      // Spanish
      'años de experiencia', 'experiencia'
    ],
    howHeardAboutUs: [
      // English
      'how did you hear', 'how you heard', 'hear about us', 'found us', 'where did you find',
      // French
      'comment as-tu entendu', 'comment avez-vous entendu', 'comment as tu entendu', 'comment avez vous entendu',
      'où avez-vous trouvé', 'entendu parler',
      // Spanish
      'cómo te enteraste', 'dónde nos encontraste'
    ],
    techStacks: [
      // English
      'tech stack', 'technology', 'programming language', 'framework', 'stack',
      'which technology', 'which framework', 'prefer', 'preferred tech',
      // French
      'stack technique', 'technologies', 'quelles sont tes stack', 'langage programmation',
      // Spanish
      'stack técnico', 'tecnología', 'lenguaje programación'
    ],
    motivationText: [
      // English
      'what motivates', 'motivat', 'why join', 'why do you want',
      // French
      'qu\'est-ce qui te motive', 'qu est ce qui te motive', 'pourquoi rejoindre',
      // Spanish
      'qué te motiva', 'por qué te gustaría'
    ],
    fitForRoleText: [
      // English
      'why you', 'right for', 'best fit', 'why are you', 'best candidate', 'strengths',
      // French
      'pourquoi penses-tu', 'pourquoi tu es', 'pourquoi tu penses', 'bonne personne',
      // Spanish
      'por qué eres', 'fortalezas'
    ],
    notes: [
      // English
      'notes', 'comment', 'description', 'message', 'comments', 'remarks',
      // French
      'notes', 'commentaire', 'description', 'remarques',
      // Spanish
      'notas', 'comentario', 'descripción', 'observaciones',
      // German
      'notizen', 'kommentar', 'beschreibung',
      // Italian
      'note', 'commento', 'descrizione',
      // Arabic
      'ملاحظات', 'comments ar',
      // Portuguese
      'notas', 'comentário', 'descrição'
    ]
  };

  for (const [key, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return key;
    }
  }

  // Fallback: match by input type
  if (fieldType === 'email') return 'email';
  if (fieldType === 'tel') return 'phone';
  if (fieldType === 'url') return 'websiteUrl';

  return null;
}

// Get all visible input fields
function getFormFields() {
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
  const fields = [];

  inputs.forEach(input => {
    // Skip if hidden or not visible
    if (!input.offsetParent) return;

    const fieldName = (input.name || '').toLowerCase();
    const fieldType = (input.type || '').toLowerCase();
    const fieldPlaceholder = (input.placeholder || '').toLowerCase();
    const fieldLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const fieldId = (input.id || '').toLowerCase();

    // For radio/checkbox groups, also check the label text
    let labelText = '';
    if (input.labels && input.labels.length > 0) {
      labelText = (input.labels[0].textContent || '').toLowerCase();
    }

    const match = matchFieldToData(fieldName + ' ' + fieldId, fieldType, fieldPlaceholder, fieldLabel + ' ' + labelText);

    if (match) {
      fields.push({
        element: input,
        matchType: match,
        name: fieldName,
        type: fieldType,
        fieldId: fieldId
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
      try {
        // Scroll into view
        field.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Handle different input types
        if (field.type === 'checkbox') {
          // For checkboxes, check if the value matches
          if (field.element.value.toLowerCase().includes(value.toLowerCase()) ||
              value.toLowerCase().includes(field.element.value.toLowerCase())) {
            field.element.checked = true;
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            filled.push(field.matchType);
            details.push(`✓ ${field.name || field.matchType}`);
          }
        } else if (field.type === 'radio') {
          // For radio buttons, check if the value or label matches
          const label = field.element.labels?.[0]?.textContent || field.element.value;
          if (label.toLowerCase().includes(value.toLowerCase()) ||
              value.toLowerCase().includes(label.toLowerCase())) {
            field.element.checked = true;
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            filled.push(field.matchType);
            details.push(`✓ ${label || field.matchType}`);
          }
        } else if (field.element.tagName === 'SELECT') {
          // For select dropdowns, try to find matching option
          const options = field.element.querySelectorAll('option');
          let foundMatch = false;
          
          options.forEach(option => {
            if (option.textContent.toLowerCase().includes(value.toLowerCase()) ||
                option.value.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(option.textContent.toLowerCase())) {
              field.element.value = option.value;
              foundMatch = true;
            }
          });

          if (foundMatch) {
            field.element.dispatchEvent(new Event('change', { bubbles: true }));
            filled.push(field.matchType);
            details.push(`✓ ${field.name || field.matchType}`);
          }
        } else {
          // Regular text input
          field.element.value = value;
          filled.push(field.matchType);
          details.push(`✓ ${field.name || field.matchType}`);
        }

        // Trigger events
        field.element.dispatchEvent(new Event('input', { bubbles: true }));
        field.element.dispatchEvent(new Event('change', { bubbles: true }));
        field.element.dispatchEvent(new Event('blur', { bubbles: true }));

      } catch (err) {
        console.error('Error filling field:', err);
      }
    }
  });

  return {
    filled: filled.length,
    details: details.length > 0 ? details : ['No matching fields found']
  };
}

// ---- AI-assisted flow: detect fields, then fill by uid ----

const AFF_UID_ATTR = 'data-aff-uid';
const AFF_OPTVAL_ATTR = 'data-aff-optionvalue';

function getFieldLabel(el) {
  if (el.labels && el.labels.length > 0) {
    const text = el.labels[0].textContent.trim();
    if (text) return text;
  }
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
  const ariaLabelledby = el.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const labelEl = document.getElementById(ariaLabelledby);
    if (labelEl && labelEl.textContent.trim()) return labelEl.textContent.trim();
  }
  return '';
}

function getGroupLabel(el) {
  const fieldset = el.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend && legend.textContent.trim()) return legend.textContent.trim();
  }
  return getFieldLabel(el);
}

// Detect all visible, fillable fields on the page and tag them with a stable uid
// so the AI-matched values can be written back to the exact same elements later.
function detectFields() {
  let counter = 0;
  const fields = [];
  const radioGroupUid = {}; // name -> uid, so all radios in a group share one field entry

  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="file"]):not([type="password"]), textarea, select'
  );

  inputs.forEach(el => {
    if (!el.offsetParent) return; // skip hidden/invisible elements

    const type = (el.type || el.tagName.toLowerCase()).toLowerCase();
    const label = getFieldLabel(el);

    if (type === 'radio' && el.name) {
      const groupKey = 'radio:' + el.name;
      const optionEntry = { value: el.value || '', label: label || el.value || '' };

      if (radioGroupUid[groupKey]) {
        const uid = radioGroupUid[groupKey];
        el.setAttribute(AFF_UID_ATTR, uid);
        el.setAttribute(AFF_OPTVAL_ATTR, el.value || '');
        const field = fields.find(f => f.uid === uid);
        if (field) field.options.push(optionEntry);
      } else {
        const uid = 'aff-' + (counter++);
        radioGroupUid[groupKey] = uid;
        el.setAttribute(AFF_UID_ATTR, uid);
        el.setAttribute(AFF_OPTVAL_ATTR, el.value || '');
        fields.push({
          uid,
          type: 'radio-group',
          name: el.name,
          label: getGroupLabel(el) || el.name,
          options: [optionEntry]
        });
      }
      return;
    }

    const uid = 'aff-' + (counter++);
    el.setAttribute(AFF_UID_ATTR, uid);

    if (el.tagName === 'SELECT') {
      const options = Array.from(el.querySelectorAll('option'))
        .map(o => ({ value: o.value, label: o.textContent.trim() }))
        .filter(o => o.value !== '');
      fields.push({ uid, type: 'select', name: el.name || '', label: label || el.name || el.id, options });
    } else if (type === 'checkbox') {
      fields.push({ uid, type: 'checkbox', name: el.name || '', label: label || el.value || el.name });
    } else {
      fields.push({
        uid,
        type: type || 'text',
        name: el.name || '',
        label: label || el.placeholder || el.name || el.id,
        placeholder: el.placeholder || ''
      });
    }
  });

  return { count: fields.length, fields };
}

// Fill fields previously tagged by detectFields(), given [{uid, value}, ...]
function fillDetectedFields(matches) {
  const filled = [];
  const details = [];

  (matches || []).forEach(match => {
    const { uid, value } = match || {};
    if (!uid || value === undefined || value === null || String(value).trim() === '') return;

    const elements = document.querySelectorAll(`[${AFF_UID_ATTR}="${CSS.escape(uid)}"]`);
    if (elements.length === 0) return;

    try {
      const first = elements[0];
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (first.type === 'radio') {
        let target = null;
        elements.forEach(el => {
          const optVal = (el.getAttribute(AFF_OPTVAL_ATTR) || '').toLowerCase();
          const optLabel = getFieldLabel(el).toLowerCase();
          const wanted = String(value).toLowerCase();
          if (optVal === wanted || (optLabel && optLabel.includes(wanted))) {
            target = el;
          }
        });
        if (target) {
          target.checked = true;
          target.dispatchEvent(new Event('change', { bubbles: true }));
          filled.push(uid);
          details.push(`✓ ${getGroupLabel(target) || uid}`);
        }
      } else if (first.type === 'checkbox') {
        const truthy = ['true', 'yes', '1', 'checked', 'on'].includes(String(value).toLowerCase());
        if (truthy) {
          first.checked = true;
          first.dispatchEvent(new Event('change', { bubbles: true }));
          filled.push(uid);
          details.push(`✓ ${getFieldLabel(first) || uid}`);
        }
      } else if (first.tagName === 'SELECT') {
        const options = Array.from(first.querySelectorAll('option'));
        const wanted = String(value).toLowerCase();
        const optionMatch = options.find(o =>
          o.value.toLowerCase() === wanted ||
          o.textContent.trim().toLowerCase() === wanted ||
          o.textContent.trim().toLowerCase().includes(wanted)
        );
        if (optionMatch) {
          first.value = optionMatch.value;
          first.dispatchEvent(new Event('change', { bubbles: true }));
          filled.push(uid);
          details.push(`✓ ${getFieldLabel(first) || uid}`);
        }
      } else {
        first.value = value;
        first.dispatchEvent(new Event('input', { bubbles: true }));
        first.dispatchEvent(new Event('change', { bubbles: true }));
        first.dispatchEvent(new Event('blur', { bubbles: true }));
        filled.push(uid);
        details.push(`✓ ${getFieldLabel(first) || uid}`);
      }
    } catch (err) {
      console.error('Error filling detected field:', err);
    }
  });

  return {
    filled: filled.length,
    details: details.length > 0 ? details : ['No matching fields found']
  };
}