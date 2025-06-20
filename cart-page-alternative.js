// NOTE: This is an alternative approach that would be added to your theme's cart.liquid file

// You can add this to your theme's cart.liquid file just before the closing </body> tag

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Function to check if cart has pre-order items
  function checkForPreOrders() {
    // Get cart data
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Check each item in cart for pre-order conditions
        const cartItems = cart.items || [];
        const preOrderPromises = cartItems.map(item => {
          return fetch(`/products/${item.handle}.js`)
            .then(response => response.json())
            .then(product => {
              // Get the variant
              const variant = product.variants.find(v => v.id === item.variant_id);
              
              // Check inventory condition first
              if (variant && variant.inventory_quantity <= 0 && product.available) {
                return true;
              }
              
              // Check product tags for "pre-order" tag (easier than metafields)
              if (product.tags && product.tags.some(tag => 
                tag.toLowerCase().includes('pre-order') || 
                tag.toLowerCase().includes('preorder'))
              ) {
                return true;
              }
              
              return false;
            })
            .catch(error => {
              console.error('Error fetching product data:', error);
              return false;
            });
        });
        
        // Wait for all checks to complete
        return Promise.all(preOrderPromises).then(results => {
          // If any item is a pre-order, show the banner
          return results.some(isPreOrder => isPreOrder);
        });
      })
      .then(hasPreOrder => {
        if (hasPreOrder) {
          showPreOrderBanner();
        }
      })
      .catch(error => {
        console.error('Error checking for pre-orders:', error);
      });
  }
  
  // Function to display the pre-order banner
  function showPreOrderBanner() {
    // Create banner if it doesn't exist
    if (!document.querySelector('.pre-order-banner')) {
      const banner = document.createElement('div');
      banner.className = 'pre-order-banner';
      banner.innerHTML = `
        <strong>YOUR BASKET CONTAINS A PRE-ORDER!</strong> 
        <a href="/pages/pre-orders">Click here for more information about pre-orders</a>
        <button class="pre-order-close" aria-label="Close">×</button>
      `;
      
      // Insert at top of cart
      const cartForm = document.querySelector('form[action="/cart"]');
      if (cartForm) {
        cartForm.parentNode.insertBefore(banner, cartForm);
        
        // Add close button functionality
        const closeButton = banner.querySelector('.pre-order-close');
        if (closeButton) {
          closeButton.addEventListener('click', function() {
            banner.remove();
          });
        }
      }
    }
  }
  
  // Style for the banner
  const style = document.createElement('style');
  style.textContent = `
    .pre-order-banner {
      background-color: #fff8db;
      border: 1px solid #f5d77e;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: bold;
      position: relative;
    }
    
    .pre-order-banner a {
      color: #1773b0;
      text-decoration: underline;
    }
    
    .pre-order-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
  
  // Run the check when the page loads
  checkForPreOrders();
  
  // Also check when the cart is updated (if using AJAX cart)
  document.addEventListener('cart:updated', checkForPreOrders);
  document.addEventListener('cart:refresh', checkForPreOrders);
});
</script>
