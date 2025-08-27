/**
 * Cart Duties Calculator Script
 * This script can be added to your Shopify theme's cart page to calculate and display US duties
 * Add this script to your theme's assets folder and include it in cart.liquid
 */

class CartDutiesCalculator {
  constructor() {
    this.apiEndpoint = 'https://heroku.puzzlesgalore.co.uk/proxy/calculate-duties';
    this.isUSCart = false;
    this.dutiesData = null;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  start() {
    this.checkCartCountry();
    this.bindEvents();
    this.calculateDuties();
  }

  bindEvents() {
    // Listen for cart updates
    document.addEventListener('cart:updated', () => this.calculateDuties());
    document.addEventListener('cart:refresh', () => this.calculateDuties());
    
    // Listen for shipping address changes if available
    const shippingForm = document.querySelector('form[name="shipping"]');
    if (shippingForm) {
      shippingForm.addEventListener('change', () => {
        setTimeout(() => this.calculateDuties(), 500); // Delay to allow form processing
      });
    }
  }

  async checkCartCountry() {
    try {
      // Try to get shipping address from cart attributes or form
      const shippingCountry = this.getShippingCountry();
      this.isUSCart = ['US', 'USA', 'UNITED STATES'].includes(shippingCountry.toUpperCase());
    } catch (error) {
      console.log('Could not determine shipping country, assuming non-US');
      this.isUSCart = false;
    }
  }

  getShippingCountry() {
    // Try multiple methods to get shipping country
    
    // Method 1: Check cart attributes
    if (window.cart && window.cart.attributes && window.cart.attributes.shipping_country) {
      return window.cart.attributes.shipping_country;
    }
    
    // Method 2: Check shipping form
    const countrySelect = document.querySelector('select[name*="country"], select[name*="Country"]');
    if (countrySelect && countrySelect.value) {
      return countrySelect.value;
    }
    
    // Method 3: Check hidden inputs
    const countryInput = document.querySelector('input[name*="country"], input[name*="Country"]');
    if (countryInput && countryInput.value) {
      return countryInput.value;
    }
    
    // Method 4: Try to detect from checkout URL or other indicators
    if (window.location.href.includes('/checkouts/') && window.Shopify && window.Shopify.checkout) {
      return window.Shopify.checkout.shipping_address?.country_code || '';
    }
    
    return '';
  }

  async calculateDuties() {
    if (!this.isUSCart) {
      this.hideDutiesBanner();
      return;
    }

    try {
      const cart = await this.fetchCart();
      
      if (!cart.items || cart.items.length === 0) {
        this.hideDutiesBanner();
        return;
      }

      // Convert cart items to format expected by API
      const items = cart.items.map(item => ({
        title: item.product_title,
        price: item.price / 100, // Shopify returns price in cents
        quantity: item.quantity,
        product_type: item.product_type,
        tags: [] // Tags not available in cart API
      }));

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items,
          totalValue: cart.total_price / 100, // Convert from cents
          currency: window.Shopify?.currency?.active || 'GBP',
          shippingAddress: {
            country_code: this.getShippingCountry()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.dutiesData = data;
      
      if (data.dutyRequired) {
        this.showDutiesBanner(data);
      } else {
        this.hideDutiesBanner();
      }

    } catch (error) {
      console.error('Error calculating duties:', error);
      this.showErrorBanner();
    }
  }

  async fetchCart() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  showDutiesBanner(dutiesData) {
    // Remove existing banner
    this.hideDutiesBanner();

    const banner = document.createElement('div');
    banner.className = 'us-duties-banner';
    banner.id = 'us-duties-banner';
    
    const formatCurrency = (amount, currency) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    };

    banner.innerHTML = `
      <div class="us-duties-banner__content">
        <h3 class="us-duties-banner__title">🇺🇸 US Customs Duties Required</h3>
        
        <div class="us-duties-banner__info">
          <p><strong>Due to new US import regulations, all shipments from the UK to the US are subject to customs duties.</strong></p>
          
          <div class="us-duties-breakdown">
            <div class="us-duties-breakdown__row">
              <span>Customs Duty (10%)</span>
              <span class="us-duties-breakdown__amount">${formatCurrency(dutiesData.totalDuties, dutiesData.currency)}</span>
            </div>
            <div class="us-duties-breakdown__row">
              <span>Processing Fee</span>
              <span class="us-duties-breakdown__amount">${formatCurrency(dutiesData.adminFee, dutiesData.currency)}</span>
            </div>
            <div class="us-duties-breakdown__row us-duties-breakdown__total">
              <span><strong>Total Additional Charges</strong></span>
              <span class="us-duties-breakdown__amount"><strong>${formatCurrency(dutiesData.totalCharges, dutiesData.currency)}</strong></span>
            </div>
          </div>
          
          <div class="us-duties-banner__success">
            <p><strong>✅ No Surprises at Delivery!</strong></p>
            <p>We're switching to <strong>Royal Mail PDDP (Postage Duties Delivery Paid)</strong> - this means we'll handle all duties upfront so there are no additional charges or delays when your order arrives!</p>
          </div>
          
          <small class="us-duties-banner__hts">HTS Code: ${dutiesData.htsCode} (Jigsaw puzzles classified as toys)</small>
        </div>
        
        <button class="us-duties-banner__close" aria-label="Close">&times;</button>
      </div>
    `;

    // Add styles if not already present
    if (!document.querySelector('#us-duties-banner-styles')) {
      this.addStyles();
    }

    // Insert banner at top of cart
    const cartForm = document.querySelector('form[action="/cart"]') || 
                     document.querySelector('.cart') || 
                     document.querySelector('#cart') ||
                     document.querySelector('main');
    
    if (cartForm) {
      cartForm.insertBefore(banner, cartForm.firstChild);
      
      // Add close functionality
      const closeButton = banner.querySelector('.us-duties-banner__close');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.hideDutiesBanner());
      }
    }
  }

  showErrorBanner() {
    this.hideDutiesBanner();

    const banner = document.createElement('div');
    banner.className = 'us-duties-banner us-duties-banner--error';
    banner.id = 'us-duties-banner';
    
    banner.innerHTML = `
      <div class="us-duties-banner__content">
        <h3 class="us-duties-banner__title">⚠️ Customs Duties Information</h3>
        <div class="us-duties-banner__info">
          <p>We're calculating customs duties for your US shipment. This will be added to your order during checkout.</p>
          <p><strong>Note:</strong> All shipments to the US are subject to a 10% customs duty plus processing fees due to new regulations.</p>
        </div>
        <button class="us-duties-banner__close" aria-label="Close">&times;</button>
      </div>
    `;

    const cartForm = document.querySelector('form[action="/cart"]') || document.querySelector('.cart');
    if (cartForm) {
      cartForm.insertBefore(banner, cartForm.firstChild);
      
      const closeButton = banner.querySelector('.us-duties-banner__close');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.hideDutiesBanner());
      }
    }
  }

  hideDutiesBanner() {
    const existingBanner = document.querySelector('#us-duties-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'us-duties-banner-styles';
    style.textContent = `
      .us-duties-banner {
        background-color: #f8f9fa;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .us-duties-banner--error {
        border-color: #ffc107;
        background-color: #fff3cd;
      }
      
      .us-duties-banner__title {
        margin: 0 0 12px 0;
        color: #007bff;
        font-size: 18px;
        font-weight: bold;
      }
      
      .us-duties-banner--error .us-duties-banner__title {
        color: #856404;
      }
      
      .us-duties-banner__info p {
        margin: 8px 0;
        line-height: 1.4;
      }
      
      .us-duties-breakdown {
        background: white;
        border-radius: 4px;
        padding: 12px;
        margin: 12px 0;
      }
      
      .us-duties-breakdown__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
      }
      
      .us-duties-breakdown__total {
        border-top: 1px solid #dee2e6;
        margin-top: 8px;
        padding-top: 12px;
      }
      
      .us-duties-breakdown__amount {
        font-family: monospace;
      }
      
      .us-duties-banner__success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        padding: 12px;
        margin: 12px 0;
      }
      
      .us-duties-banner__success p {
        margin: 4px 0;
      }
      
      .us-duties-banner__hts {
        display: block;
        margin-top: 12px;
        color: #6c757d;
        font-size: 12px;
      }
      
      .us-duties-banner__close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6c757d;
        line-height: 1;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .us-duties-banner__close:hover {
        color: #495057;
      }
      
      @media (max-width: 768px) {
        .us-duties-banner {
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .us-duties-banner__title {
          font-size: 16px;
          margin-bottom: 8px;
          padding-right: 30px;
        }
        
        .us-duties-breakdown {
          padding: 10px;
        }
        
        .us-duties-breakdown__row {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Initialize when script loads
(() => {
  new CartDutiesCalculator();
})();