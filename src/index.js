require('dotenv').config();
const systemPrompt = require('./agent/systemPrompt');
const orderStatusHandler = require('./agent/orderStatusHandler');
const getOrderStatus = require('./tools/getOrderStatus');

console.log('Flipkart Voice Agent initialized');
console.log('System ready to handle voice commands...');

// Export main functions
module.exports = {
  systemPrompt,
  orderStatusHandler,
  getOrderStatus
};
