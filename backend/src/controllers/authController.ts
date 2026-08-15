import { Request, Response } from 'express';
import { generateToken } from '../config/jwt';
import { getSeedUsers, getSeedDepartments } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = getSeedUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted. Only System Admin login is permitted.'
      });
    }

    // Standardized authentication check
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentCode: user.departmentCode,
        departmentName: user.departmentName
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  return res.json({
    success: true,
    user: req.user
  });
}
