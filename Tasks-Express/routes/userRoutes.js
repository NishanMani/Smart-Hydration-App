import express from 'express';
import {
  createUser,
  loginUser,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

import { refreshAccessToken } from "../controllers/authController.js";
import {protect,adminOnly} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

router.post("/refresh-token", refreshAccessToken);
router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/:id',protect, getUser);
router.put('/:id', updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
