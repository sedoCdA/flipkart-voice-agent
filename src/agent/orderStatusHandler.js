const getOrderStatus = require('../tools/getOrderStatus');

async function handleOrderStatusRequest(orderId) {
  try {
    const orderStatus = await getOrderStatus(orderId);
    return {
      success: true,
      message: `Order ${orderId} status: ${orderStatus.status}`,
      data: orderStatus
    };
  } catch (error) {
    return {
      success: false,
      message: `Unable to retrieve status for order ${orderId}`,
      error: error.message
    };
  }
}

module.exports = {
  handleOrderStatusRequest
};
