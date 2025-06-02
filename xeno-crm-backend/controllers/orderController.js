// controllers/orderController.js
import Order from '../models/Order.js';

// Create a new order
const addOrder = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    // Create the order data object with userId for tenant isolation
    const orderData = {
      userId: req.user._id,  // Add user ID for tenant isolation
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
    
    // Use populate to include customer data, filtering by the current user's ID for tenant isolation
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('customerId', 'firstName lastName email')
      .lean();
      
    console.log(`Fetching orders for user: ${req.user._id}`);
    
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
    // Find order by ID and user ID for tenant isolation
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id  // Filter by the authenticated user's ID
    })
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
    // First check if the order exists and belongs to this user
    const existingOrder = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id  // Filter by the authenticated user's ID
    });
    
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found or you do not have access to it' });
    }
    
    // Keep the userId in the update to prevent changing ownership
    const updateData = {
      ...req.body,
      userId: req.user._id  // Maintain the userId to prevent ownership change
    };
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      updateData, 
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
    // Add userId filter for tenant isolation
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id  // Filter by the authenticated user's ID
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found or you do not have access to it' });
    }
    
    // Delete the order - already verified it belongs to this user
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
