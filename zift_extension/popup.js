// ## popup.js

document.addEventListener('DOMContentLoaded', () => {
  const brandSelect = document.getElementById('brand');
  const denomSelect = document.getElementById('denom');
  const emailInput = document.getElementById('email');
  const addBrandBtn = document.getElementById('addBrand');
  const newBrandInput = document.getElementById('newBrand');
  const startBtn = document.getElementById('start');

  // Default brands — you will add more over time.
  const DEFAULT_BRANDS = [
    "Lowe's",
    "The Home Depot"
  ];

  function populateBrands(list){
    brandSelect.innerHTML = '';
    list.forEach(b => {
      const o = document.createElement('option');
      o.value = b;
      o.textContent = b;
      brandSelect.appendChild(o);
    });
  }

  // Load saved values on popup open
  chrome.storage.local.get(['brand', 'denom', 'email'], (result) => {
    if(result.brand) brandSelect.value = result.brand;
    if(result.denom) denomSelect.value = result.denom;
    if(result.email) emailInput.value = result.email;
  });

  // Save brand selection
  brandSelect.addEventListener('change', () => {
    chrome.storage.local.set({ brand: brandSelect.value });
  });

  // Save denomination selection
  denomSelect.addEventListener('change', () => {
    chrome.storage.local.set({ denom: denomSelect.value });
  });

  // Save email input
  emailInput.addEventListener('input', () => {
    chrome.storage.local.set({ email: emailInput.value });
  });

  // load saved brands
  chrome.storage.local.get(['brands'], ({brands}) => {
    if (!brands || !brands.length) brands = DEFAULT_BRANDS;
    populateBrands(brands);
  });

  addBrandBtn.addEventListener('click', ()=>{
    const v = newBrandInput.value.trim();
    if(!v) return;
    chrome.storage.local.get(['brands'], ({brands}) => {
      if(!brands) brands = DEFAULT_BRANDS.slice();
      if(!brands.includes(v)) brands.push(v);
      chrome.storage.local.set({brands}, ()=>{
        populateBrands(brands);
        newBrandInput.value = '';
      });
    });
  });

  startBtn.addEventListener('click', async ()=>{
    const brand = brandSelect.value;
    const denom = denomSelect.value;
    const email = emailInput.value.trim() || 'your_email@gmail.com';

    // Save current values to storage
    chrome.storage.local.set({ brand, denom, email });

    // send message to content script in active tab
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab) { alert('No active tab'); return; }

    chrome.tabs.sendMessage(tab.id, {action:'start', brand, denom, email}, (resp) => {
      if(chrome.runtime.lastError){
        alert('Content script not reachable. Make sure you are on zillionsgift.com page.');
      } else {
        console.log('sent start');
      }
    });
  });
});
