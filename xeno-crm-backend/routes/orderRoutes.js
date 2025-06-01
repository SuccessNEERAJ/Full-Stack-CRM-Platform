// routes/orderRoutes.js
import express from 'express';
const router = express.Router();
import { 
  addOrder, 
  getOrders, 
  getOrderById, 
  updateOrder,
  deleteOrder 
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

// Apply requireAuth middleware to all routes
router.use(requireAuth);

// GET all orders
router.get('/', getOrders);

// GET a single order
router.get('/:id', getOrderById);

// POST a new order
router.post('/', addOrder);

// PUT update an order
router.put('/:id', updateOrder);

// DELETE an order
router.delete('/:id', deleteOrder);

export default router;
