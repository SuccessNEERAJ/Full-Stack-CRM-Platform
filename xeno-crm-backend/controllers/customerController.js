// controllers/customerController.js
import Customer from '../models/Customer.js';

// Create a new customer
const addCustomer = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.firstName || !req.body.lastName || !req.body.email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }
    
    // Create with stronger write concern
    const newCustomer = await Customer.create(req.body);
    
    // Verify the customer was created by reading it back
    const verifiedCustomer = await Customer.findById(newCustomer._id);
    
    if (!verifiedCustomer) {
      return res.status(500).json({ message: 'Customer creation could not be verified' });
    }
    
    // Return the created customer
    res.status(201).json(verifiedCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    
    // Ensure totalSpend is properly formatted for each customer
    const formattedCustomers = customers.map(customer => {
      // Convert customer to a plain object so we can modify it
      const customerObj = customer.toObject();
      
      // Ensure totalSpend is a number
      customerObj.totalSpend = parseFloat(customerObj.totalSpend || 0);
      
      return customerObj;
    });
    
    console.log('Fetched customers with totalSpend:', formattedCustomers.map(c => ({ 
      id: c._id, 
      name: `${c.firstName} ${c.lastName}`, 
      totalSpend: c.totalSpend 
    })));
    
    res.status(200).json(formattedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    // Find the customer to verify it exists
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Check if customer has associated orders
    // Import Order dynamically to avoid circular dependencies
    const { default: Order } = await import('../models/Order.js');
    const associatedOrders = await Order.countDocuments({ customerId: req.params.id });
    
    if (associatedOrders > 0) {
      return res.status(400).json({ 
        message: `Cannot delete customer with ${associatedOrders} associated orders. Delete the orders first.` 
      });
    }
    
    // Delete the customer
    await Customer.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: error.message });
  }
};

export {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
