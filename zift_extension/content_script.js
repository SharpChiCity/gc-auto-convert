// ## content_script.js

// > Notes: this script is intentionally defensive — it searches for elements by text/placeholder and uses small random delays (1–3s) between clicks to appear "human" as you requested. It will `alert()` and stop if it can't find the brand element.

(function(){
  // helper delays
  function randMs(min=1000,max=5000){ return Math.floor(Math.random()*(max-min+1))+min; }
  
  async function sleepWithTimer(ms){ 
    return new Promise(res=>setTimeout(res,ms)); 
  }

  // show visual timer overlay
  async function sleepWithTimer(ms){
    const overlay = document.createElement('div');
    overlay.id = 'autofill-timer-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: Arial, sans-serif;
    `;
    
    const text = document.createElement('div');
    text.style.cssText = `
      color: white;
      font-size: 48px;
      font-weight: bold;
      text-align: center;
    `;
    
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    const startTime = Date.now();
    const endTime = startTime + ms;
    
    return new Promise(res => {
      const updateTimer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        text.innerText = `Waiting...\n${remaining}s`;
        
        if(remaining <= 0){
          clearInterval(updateTimer);
          overlay.remove();
          res();
        }
      }, 100);
    });
  }

  // click with delay
  async function delayedClick(el){
    if(!el) throw new Error('element-missing');
    el.scrollIntoView({behavior:'smooth',block:'center'});
    await sleepWithTimer(randMs(100,1000));
    el.click();
  }

  // normalize text: remove special quotes, extra whitespace, etc.
  function normalizeText(text){
    return (text || '')
      .trim()
      .toLowerCase()
      .replace(/[''´’`]/g, "'")           // normalize quotes
      .replace(/[""«»]/g, '"')           // normalize double quotes
      .replace(/[–—]/g, '-')             // normalize dashes
      .replace(/\s+/g, ' ');             // collapse whitespace
  }

  // find element by visible text (case-insensitive, normalized)
  function findByText(root, tagNames, text){
    const lower = normalizeText(text);
    for(const tag of tagNames){
      const nodes = Array.from(root.querySelectorAll(tag));
      for(const n of nodes){
        if(normalizeText(n.innerText).includes(lower)) return n;
        if(normalizeText(n.value).includes(lower)) return n;
        if(normalizeText(n.getAttribute('aria-label')||'').includes(lower)) return n;
        if(normalizeText(n.getAttribute('title')||'').includes(lower)) return n;
      }
    }
    return null;
  }

  // wait for element to appear in DOM
  function waitForElement(selector, timeout=10000){
    return new Promise((resolve,reject)=>{
      const startTime = Date.now();
      const checkInterval = setInterval(()=>{
        const el = document.querySelector(selector);
        if(el){ 
          clearInterval(checkInterval); 
          resolve(el); 
        }
        if(Date.now()-startTime > timeout){ 
          clearInterval(checkInterval); 
          reject(new Error('Element not found: '+selector)); 
        }
      }, 300);
    });
  }

  async function onStart({brand, denom, email}){
    try{
      const currentUrl = location.href;

      // If a "Show ... per page" limiter exists, choose "All" to display all items
      if(currentUrl.includes('zillionsgift.com')){
        const limiter = document.querySelector('select#limiter, select[data-role="limiter"], select.limiter-options');
        if(limiter){
          const want = 'all';
          if(((limiter.value||'').toString().toLowerCase() !== want)){
            const opt = limiter.querySelector('option[value="' + want + '"]')
              || Array.from(limiter.options).find(o => ((o.value||'').toString().toLowerCase() === want) || ((o.text||'').trim().toLowerCase() === 'all'));
            if(opt){
              opt.selected = true;
              limiter.value = opt.value;
              limiter.dispatchEvent(new Event('change', {bubbles:true}));
              await sleepWithTimer(randMs());
              // allow time for page to update / reload if the limiter triggers navigation
              await waitForUrlChange(5000);
            }
          }
        }
      }

      // Step 2: find brand element on product listing page
      if(currentUrl.includes('zillionsgift.com') && !currentUrl.includes('/checkout')){
        // find a link/button that contains the brand text
        let possible = null;
        
        // First try: find the product item li, then the link inside it
        const productItems = Array.from(document.querySelectorAll('li.product-item'));
        for(const item of productItems){
          const nameSpan = item.querySelector('.product-item-name .product-item-link');
          if(nameSpan && normalizeText(nameSpan.innerText).includes(normalizeText(brand))){
            possible = item.querySelector('a.product-item-photo');
            break;
          }
        }
        
        // Fallback: use original findByText method
        if(!possible){
          possible = findByText(document, ['a','button','div','span','li'], brand);
        }
        
        if(!possible){
          alert('Brand not found on this page: '+brand);
          return;
        }

        await delayedClick(possible);

                
        // Continue the rest on the new page (we can simply continue because same content script runs)
      }

      // Step 3: on brand email page, select denomination, fill emails, click add to cart
      if(location.pathname.includes('-email') || location.href.includes('/checkout')===false){
        // Wait for the denomination select to appear before proceeding
        try {
          await sleepWithTimer(randMs());
          await waitForElement('select[name="giftcard_amount"]', 10000);
        } catch(e) {
          console.warn('Denomination select not found:', e.message);
        }

        // Now proceed with Step 3
        let denomEl = null;
        await sleepWithTimer(randMs(1000,2000));
        // Try to find the giftcard amount select
        const giftcardSelect = document.querySelector('select[name="giftcard_amount"], select.giftcard-amount-entry, select#giftcard-amount-22');
        if(giftcardSelect){
          // Look for option with matching value
          const opt = Array.from(giftcardSelect.options).find(o => 
            normalizeText(o.value).includes(normalizeText(denom)) || 
            normalizeText(o.text).includes(normalizeText(denom)) ||
            normalizeText(o.text).includes('$' + denom)
          );
          if(opt){
            denomEl = giftcardSelect;
            giftcardSelect.value = opt.value;
            giftcardSelect.dispatchEvent(new Event('change', {bubbles:true}));
            
            // If "Other Amount..." was selected, fill the custom input
            if(opt.value === 'custom'){
              await sleepWithTimer(randMs());
              const customInput = document.querySelector('input[name="custom_giftcard_amount"], input#giftcard-amount-input-22');
              if(customInput){
                customInput.style.display = 'block';
                customInput.focus();
                await sleepWithTimer(randMs());
                customInput.value = '$' + denom;
                customInput.dispatchEvent(new Event('input', {bubbles:true}));
              }
            }
          }
        }
        
        // Fallback: text matching
        if(!denomEl){
          const denomTextOptions = ["$"+denom, denom+".00", denom+" ", denom+'$'];
          for(const txt of denomTextOptions){
            denomEl = findByText(document, ['button','label','li','div','span','input'], txt);
            if(denomEl) break;
          }
        }
        
        if(!denomEl){
          console.warn('Denomination element not found for', denom);
        } else if(denomEl.tagName !== 'SELECT'){
          await delayedClick(denomEl);
        }

        // fill recipient email fields
        const emailFields = Array.from(document.querySelectorAll('input'))
          .filter(i => (i.placeholder||'').toLowerCase().includes('email') || (i.name||'').toLowerCase().includes('email') || (i.id||'').toLowerCase().includes('email'));
        if(emailFields.length >= 1){
          emailFields[0].focus();
          await sleepWithTimer(randMs(100, 1000));
          emailFields[0].value = email;
          emailFields[0].dispatchEvent(new Event('input', {bubbles:true}));
        }
        if(emailFields.length >= 2){
          emailFields[1].focus();
          await sleepWithTimer(randMs(100, 1000));
          emailFields[1].value = email;
          emailFields[1].dispatchEvent(new Event('input', {bubbles:true}));
        }

        // find add to cart button
        const addToCart = findByText(document, ['button','a','input'], 'add to cart') || findByText(document,['button','a','input'],'add to bag') || document.querySelector('[type="submit"]');
        if(!addToCart){
          alert('Add to cart button not found — stopping');
          return;
        }
        await delayedClick(addToCart);
      }

      // Step 4: click "Proceed to Checkout" in modal / popup
      // Wait for a short time for modal
      await sleepWithTimer(randMs());
      let proceedBtn = findByText(document, ['button','a','div','span','input'], 'proceed to checkout') || findByText(document,['button','a'],'checkout');
      if(proceedBtn){
        await delayedClick(proceedBtn);
      }

      // Step 5: on checkout page
      if(location.pathname.includes('/checkout')){
        // Wait for the checkout email input to appear
        try {
          await waitForElement('input#customer-email, input[name="username"]', 10000);
        } catch(e) {
          console.warn('Checkout email input not found:', e.message);
        }

        // find order confirmation email input
        const orderEmail = document.querySelector('input#customer-email, input.customer-email, input[name="username"]');
        
        if(orderEmail){
          orderEmail.focus();
          await sleepWithTimer(randMs());
          orderEmail.value = email;
          orderEmail.dispatchEvent(new Event('input', {bubbles:true}));
          orderEmail.dispatchEvent(new Event('change', {bubbles:true}));
        } else {
          console.warn('Checkout email input not found');
        }

        // click Place Order
        const placeBtn = document.querySelector('button[data-role="opc-continue"][type="submit"]')
          || findByText(document, ['button','input','a'],'place order') 
          || findByText(document,['button','input','a'],'complete purchase') 
          || findByText(document,['button','input','a'],'submit');
        
        if(placeBtn){
          await delayedClick(placeBtn);
        } else {
          console.warn('Place Order button not found');
        }
      }

    } catch(err){
      console.error('Autofill error', err);
      alert('Autofill script stopped due to error: '+err.message);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg && msg.action === 'start'){
      onStart(msg).then(()=>sendResponse({ok:true})).catch(e=>sendResponse({ok:false,error:e.message}));
      return true;
    }
  });

  // Also auto-run if values are in storage (for page reloads/navigation)
  chrome.storage.local.get(['brand', 'denom', 'email'], (result) => {
    if(result.brand && result.denom && result.email){
      // Only auto-run if we're on the right page
      if(location.href.includes('zillionsgift.com')){
        onStart(result);
      }
    }
  });
})();

