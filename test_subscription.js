// Simple test to verify Stripe product integration
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testProducts() {
  try {
    console.log('Testing Stripe products...');
    
    // Test weekly product
    const weeklyProduct = await stripe.products.retrieve('prod_SgbM5d8WfUgLP6');
    console.log('Weekly product:', weeklyProduct.name);
    
    const weeklyPrices = await stripe.prices.list({
      product: 'prod_SgbM5d8WfUgLP6',
      active: true,
      limit: 1
    });
    console.log('Weekly price:', weeklyPrices.data[0]?.unit_amount / 100);
    
    // Test monthly product
    const monthlyProduct = await stripe.products.retrieve('prod_SgbMQxYEXBZ0u5');
    console.log('Monthly product:', monthlyProduct.name);
    
    const monthlyPrices = await stripe.prices.list({
      product: 'prod_SgbMQxYEXBZ0u5',
      active: true,
      limit: 1
    });
    console.log('Monthly price:', monthlyPrices.data[0]?.unit_amount / 100);
    
  } catch (error) {
    console.error('Error testing products:', error.message);
  }
}

testProducts();