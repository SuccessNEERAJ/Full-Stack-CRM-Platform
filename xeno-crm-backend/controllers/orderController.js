// controllers/orderController.js
import Order from '../models/Order.js';

// Create a new order
const addOrder = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    // Create the order data object
    const orderData = {
      customerId: req.body.customerId,
      status: req.body.status || 'Pending',
      items: req.body.items || [],
      amount: req.body.amount || 0,
      tax: req.body.tax || 0,
      notes: req.body.notes
    };
    
    console.log('Creating order with data:', orderData);
    
    // Create with stronger write concern
    const newOrder = await Order.create(orderData);
    
    // Verify the order was created by reading it back
    const verifiedOrder = await Order.findById(newOrder._id)
      .populate('customerId', 'firstName lastName email');
    
    if (!verifiedOrder) {
      return res.status(500).json({ message: 'Order creation could not be verified' });
    }
    
    // Update customer's total spend
    // Import Customer dynamically to avoid circular dependencies
    const { default: Customer } = await import('../models/Customer.js');
    const customer = await Customer.findById(req.body.customerId);
    
    if (customer) {
      // Calculate the current total spend - ensure we're using numbers
      const currentTotalSpend = parseFloat(customer.totalSpend || 0);
      const orderAmount = parseFloat(orderData.amount || 0);
      
      // Calculate new total and ensure it's a valid number
      const newTotal = currentTotalSpend + orderAmount;
      
      // Update the customer's total spend
      customer.totalSpend = newTotal;
      await customer.save();
      
      // Verify the update
      const updatedCustomer = await Customer.findById(customer._id);
      console.log(`Updated customer ${customer._id} total spend from ${currentTotalSpend} to ${updatedCustomer.totalSpend}, added amount: ${orderAmount}`);
    }
    
    console.log('Order created successfully:', verifiedOrder);
    
    // Return the created order
    res.status(201).json(verifiedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    console.log('Fetching all orders with customer data');
    
    // Use populate to include customer data
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customerId', 'firstName lastName email')
      .lean();
    
    // Format orders to include customer name
    const formattedOrders = orders.map(order => {
      // Create a customer object with combined name for frontend
      const customer = order.customerId ? {
        _id: order.customerId._id,
        firstName: order.customerId.firstName || '',
        lastName: order.customerId.lastName || '',
        email: order.customerId.email || ''
      } : null;
      
      return {
        ...order,
        customer: customer
      };
    });
    
    console.log(`Returning ${formattedOrders.length} orders with customer data`);
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phone address')
      .lean();
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format order to include customer name
    const formattedOrder = {
      ...order,
      customer: order.customerId ? {
        _id: order.customerId._id,
        firstName: order.customerId.firstName || '',
        lastName: order.customerId.lastName || '',
        email: order.customerId.email || '',
        phone: order.customerId.phone || '',
        address: order.customerId.address || ''
      } : null
    };
    
    res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email')
    .lean();
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format order to include customer name
    const formattedOrder = {
      ...updatedOrder,
      customer: updatedOrder.customerId ? {
        _id: updatedOrder.customerId._id,
        firstName: updatedOrder.customerId.firstName || '',
        lastName: updatedOrder.customerId.lastName || '',
        email: updatedOrder.customerId.email || ''
      } : null
    };
    
    res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    // First find the order to get customer ID and amount for updating total spend
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Delete the order
    await Order.findByIdAndDelete(req.params.id);
    
    // Update customer's total spend if the order had an amount
    if (order.customerId && order.amount) {
      // Import Customer dynamically to avoid circular dependencies
      const { default: Customer } = await import('../models/Customer.js');
      const customer = await Customer.findById(order.customerId);
      
      if (customer) {
        // Calculate the current total spend and subtract the order amount - ensure we're using numbers
        const currentTotalSpend = parseFloat(customer.totalSpend || 0);
        const orderAmount = parseFloat(order.amount || 0);
        
        // Calculate new total and ensure it's a valid number and not negative
        const newTotal = Math.max(0, currentTotalSpend - orderAmount);
        
        // Update the customer's total spend
        customer.totalSpend = newTotal;
        await customer.save();
        
        // Verify the update
        const updatedCustomer = await Customer.findById(customer._id);
        console.log(`Updated customer ${customer._id} total spend from ${currentTotalSpend} to ${updatedCustomer.totalSpend}, subtracted amount: ${orderAmount}`);
      }
    }
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: error.message });
  }
};

export {
  addOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder
};
