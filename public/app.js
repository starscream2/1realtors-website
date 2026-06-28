// --- Listings Data (Fetched Dynamically) ---
let properties = [];

// --- DOM Elements ---
const propertiesGrid = document.getElementById('properties-grid');
const filterTabs = document.querySelectorAll('.tab-btn');
const typeFilter = document.getElementById('filter-type');
const priceFilter = document.getElementById('filter-price');
const searchBtn = document.getElementById('search-btn');
const inquiryForm = document.getElementById('inquiry-form');
const formPropertySelect = document.getElementById('form-property');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

// Header Scroll Effect
const header = document.getElementById('main-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile Nav Toggle
const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
const navLinks = document.querySelector('.nav-links');
mobileNavToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  mobileNavToggle.setAttribute('aria-expanded', isOpen);
  mobileNavToggle.querySelector('i').className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});

// Close mobile nav when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNavToggle.querySelector('i').className = 'fa-solid fa-bars';
    
    // Set active class
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    link.classList.add('active');
  });
});

// --- Modal Functionality ---
const modal = document.getElementById('property-modal');
const closeModalBtn = document.querySelector('.close-modal');

function openModal(propertyId) {
  const prop = properties.find(p => p.id === propertyId);
  if (!prop) return;

  const imagesList = prop.image.split(',');
  const sizeFeatureHtml = prop.size ? `
    <div class="modal-feature-item">
      <i class="fa-solid fa-ruler-combined"></i>
      <span>Area (Sq Ft)</span>
      <strong>${prop.size}</strong>
    </div>` : '';

  const modalBody = modal.querySelector('.modal-body');
  modalBody.innerHTML = `
    <div class="modal-gallery">
      <img id="modal-main-img" src="${imagesList[0]}" alt="${prop.title}">
      ${imagesList.length > 1 ? `
      <div class="modal-thumbnails">
        ${imagesList.map((imgUrl, idx) => `
          <img src="${imgUrl}" alt="Thumbnail ${idx+1}" class="thumb-img ${idx === 0 ? 'active' : ''}" onclick="changeModalImage(this, '${imgUrl}')">
        `).join('')}
      </div>
      ` : ''}
    </div>
    <h3>${prop.title}</h3>
    <div class="price">${prop.priceStr}</div>
    <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${prop.location}</div>
    <div class="modal-features">
      <div class="modal-feature-item">
        <i class="fa-solid fa-bed"></i>
        <span>Bedrooms</span>
        <strong>${prop.beds}</strong>
      </div>
      <div class="modal-feature-item">
        <i class="fa-solid fa-bath"></i>
        <span>Bathrooms</span>
        <strong>${prop.baths}</strong>
      </div>
      ${sizeFeatureHtml}
    </div>
    <p class="desc">${prop.description}</p>
    <button onclick="inquireForProperty('${prop.title}')" class="btn-primary btn-full">Inquire About This Property</button>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

// Global helper to switch main modal image
window.changeModalImage = function(el, url) {
  document.getElementById('modal-main-img').src = url;
  document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
  el.classList.add('active');
};

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Quick action to link modal contact back to form
window.inquireForProperty = function(title) {
  closeModal();
  formPropertySelect.value = title;
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
};

// --- Render Properties ---
function renderProperties(list) {
  propertiesGrid.innerHTML = '';
  
  if (list.length === 0) {
    propertiesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">
        <i class="fa-solid fa-house-chimney-crack" style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-accent);"></i>
        <h3>No matching properties found</h3>
        <p>Try adjusting your search filters.</p>
      </div>
    `;
    return;
  }

  list.forEach(prop => {
    const imagesList = prop.image.split(',');
    const thumbnail = imagesList[0] || 'images/luxury_villa.jpg';
    
    // Category mapping
    const categoryLabel = prop.category === 'sale' ? 'For Sale' : prop.category === 'rental' ? 'For Rent' : 'Commercial';

    // Optional Size
    const sizeStr = prop.size ? `<span><i class="fa-solid fa-ruler-combined"></i> ${prop.size} sqft</span>` : '';

    const card = document.createElement('article');
    card.className = 'property-card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${thumbnail}" alt="${prop.title}" loading="lazy">
        <span class="card-badge">${categoryLabel}</span>
      </div>
      <div class="card-content">
        <div class="card-price">${prop.priceStr}</div>
        <h3 class="card-title">${prop.title}</h3>
        <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${prop.location}</div>
        <div class="card-details">
          <span><i class="fa-solid fa-bed"></i> ${prop.beds} Beds</span>
          <span><i class="fa-solid fa-bath"></i> ${prop.baths} Baths</span>
          ${sizeStr}
        </div>
      </div>
      <div class="card-footer">
        <button onclick="openModal(${prop.id})" class="btn-primary btn-full">View Details</button>
      </div>
    `;
    propertiesGrid.appendChild(card);
  });
}

// --- Filtering Logic ---
function filterProperties(category = 'all', maxPrice = 'any', searchType = 'all') {
  let filtered = properties;

  // Filter by category (tabs)
  if (category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  // Filter by search bar type dropdown
  if (searchType !== 'all') {
    filtered = filtered.filter(p => p.category === searchType);
  }

  // Filter by price
  if (maxPrice !== 'any') {
    const priceVal = parseInt(maxPrice);
    filtered = filtered.filter(p => p.price <= priceVal);
  }

  renderProperties(filtered);
}

// Function to update price filter options dynamically based on property category
function updatePriceFilterOptions(type) {
  priceFilter.innerHTML = '';
  
  const anyOption = document.createElement('option');
  anyOption.value = 'any';
  anyOption.textContent = 'Any Price';
  priceFilter.appendChild(anyOption);
  
  if (type === 'rental') {
    const options = [
      { value: '3000', text: 'Under $3,000' },
      { value: '5000', text: 'Under $5,000' },
      { value: '10000', text: 'Under $10,000' },
      { value: '15000', text: 'Under $15,000' }
    ];
    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.text;
      priceFilter.appendChild(el);
    });
  } else {
    const options = [
      { value: '500000', text: 'Under $500,000' },
      { value: '1000000', text: 'Under $1.0M' },
      { value: '2500000', text: 'Under $2.5M' },
      { value: '5000000', text: 'Under $5.0M' }
    ];
    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.text;
      priceFilter.appendChild(el);
    });
  }
}

// Event listener for type dropdown change
typeFilter.addEventListener('change', () => {
  updatePriceFilterOptions(typeFilter.value);
});

// Event Listeners for Category Tabs
filterTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    filterTabs.forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    
    const category = tab.getAttribute('data-filter');
    typeFilter.value = category;
    updatePriceFilterOptions(category);
    priceFilter.value = 'any';
    
    filterProperties(category, 'any', 'all');
  });
});

// Event Listener for Search Bar button
searchBtn.addEventListener('click', () => {
  const selectedType = typeFilter.value;
  filterTabs.forEach(btn => btn.classList.remove('active'));
  const matchingTab = document.querySelector(`[data-filter="${selectedType}"]`);
  if (matchingTab) {
    matchingTab.classList.add('active');
  }
  
  filterProperties(selectedType, priceFilter.value, 'all');
});

// --- Populate Contact Form Dropdown ---
function populateDropdown() {
  properties.forEach(prop => {
    const opt = document.createElement('option');
    opt.value = prop.title;
    opt.textContent = `${prop.title} (${prop.location})`;
    formPropertySelect.appendChild(opt);
  });
  
  // Also add a general inquiry option
  const generalOpt = document.createElement('option');
  generalOpt.value = "General Inquiry / Custom Request";
  generalOpt.textContent = "General Inquiry / Custom Request";
  formPropertySelect.appendChild(generalOpt);
}

// --- Inquiry Form Submission (Gmail Bridge Integration) ---
inquiryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('form-name').value.trim();
  const phone = document.getElementById('form-phone').value.trim();
  const email = document.getElementById('form-email').value.trim();
  const propertyTitle = formPropertySelect.value;
  const message = document.getElementById('form-message').value.trim();

  // Reset status
  formStatus.className = 'form-status hidden';
  formStatus.textContent = '';
  
  // Disable button
  submitBtn.disabled = true;
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span>Sending inquiry...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

  try {
    const response = await fetch('/api/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, phone, email, propertyTitle, message })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      formStatus.className = 'form-status success';
      formStatus.textContent = 'Thank you! Your inquiry was sent. Our agents have been notified via Email.';
      inquiryForm.reset();
    } else {
      throw new Error(result.error || 'Failed to submit inquiry.');
    }
  } catch (error) {
    console.error("Submission error:", error);
    formStatus.className = 'form-status error';
    formStatus.textContent = error.message || 'Connecting to backend failed. Please ensure the server is running.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

// --- Initial Execution ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/properties');
    if (response.ok) {
      properties = await response.json();
    } else {
      throw new Error("HTTP error: " + response.status);
    }
  } catch (error) {
    console.error("Failed to load listings from Google Sheets:", error);
    properties = [];
  }
  renderProperties(properties);
  populateDropdown();
});
