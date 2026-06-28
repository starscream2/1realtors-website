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

  const modalBody = modal.querySelector('.modal-body');
  modalBody.innerHTML = `
    <img src="${prop.image}" alt="${prop.title}">
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
      <div class="modal-feature-item">
        <i class="fa-solid fa-ruler-combined"></i>
        <span>Area (Sq Ft)</span>
        <strong>${prop.size}</strong>
      </div>
    </div>
    <p class="desc">${prop.description}</p>
    <button onclick="inquireForProperty('${prop.title}')" class="btn-primary btn-full">Inquire About This Property</button>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

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
    const card = document.createElement('article');
    card.className = 'property-card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${prop.image}" alt="${prop.title}" loading="lazy">
        <span class="card-badge">${prop.category === 'villa' ? 'Villa' : prop.category === 'apartment' ? 'Penthouse' : 'House'}</span>
      </div>
      <div class="card-content">
        <div class="card-price">${prop.priceStr}</div>
        <h3 class="card-title">${prop.title}</h3>
        <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${prop.location}</div>
        <div class="card-details">
          <span><i class="fa-solid fa-bed"></i> ${prop.beds} Beds</span>
          <span><i class="fa-solid fa-bath"></i> ${prop.baths} Baths</span>
          <span><i class="fa-solid fa-ruler-combined"></i> ${prop.size} sqft</span>
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

// Event Listeners for Category Tabs
filterTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    filterTabs.forEach(btn => btn.classList.remove('active'));
    tab.classList.add('active');
    
    // Clear search bar dropdowns to make filtering intuitive
    typeFilter.value = 'all';
    priceFilter.value = 'any';
    
    filterProperties(tab.getAttribute('data-filter'));
  });
});

// Event Listener for Search Bar button
searchBtn.addEventListener('click', () => {
  // Clear tab active state (set to all)
  filterTabs.forEach(btn => btn.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
  
  filterProperties('all', priceFilter.value, typeFilter.value);
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
