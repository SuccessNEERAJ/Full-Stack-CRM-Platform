// routes/customerRoutes.js
import express from 'express';
const router = express.Router();
import { 
  addCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer,
  deleteCustomer 
} from '../controllers/customerController.js';

// GET all customers
router.get('/', getCustomers);

// GET a single customer
router.get('/:id', getCustomerById);

// POST a new customer
router.post('/', addCustomer);

// PUT update a customer
router.put('/:id', updateCustomer);

// DELETE a customer
router.delete('/:id', deleteCustomer);

export default router;
