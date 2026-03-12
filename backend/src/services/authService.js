const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'los-demo-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

class AuthService {
  async initializeUsers() {
    const users = await fileStorage.read('users');
    
    if (users.length === 0) {
      // Create default demo users
      const defaultUsers = [
        {
          id: uuidv4(),
          username: 'rm1',
          password: await bcrypt.hash('password123', 10),
          name: 'Maria Santos',
          role: 'RM',
          email: 'maria.santos@bank.ph',
          created_at: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'analyst1',
          password: await bcrypt.hash('password123', 10),
          name: 'Juan Dela Cruz',
          role: 'Credit Analyst',
          email: 'juan.delacruz@bank.ph',
          created_at: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'approver1',
          password: await bcrypt.hash('password123', 10),
          name: 'Ana Reyes',
          role: 'Approver',
          email: 'ana.reyes@bank.ph',
          created_at: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          name: 'System Admin',
          role: 'Admin',
          email: 'admin@bank.ph',
          created_at: new Date().toISOString()
        }
      ];

      await fileStorage.write('users', defaultUsers);
      console.log('Default users created');
    }
  }

  async login(username, password, metadata = {}) {
    const users = await fileStorage.read('users');
    const user = users.find(u => u.username === username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Log login action
    await auditService.log({
      actor_id: user.id,
      actor_name: user.name,
      action: auditService.ACTIONS.LOGIN,
      entity_type: 'User',
      entity_id: user.id,
      metadata
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await fileStorage.findById('users', decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUserById(userId) {
    const user = await fileStorage.findById('users', userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getAllUsers() {
    const users = await fileStorage.read('users');
    return users.map(({ password, ...user }) => user);
  }

  // Role checking helpers
  isRM(role) {
    return role === 'RM';
  }

  isAnalyst(role) {
    return role === 'Credit Analyst';
  }

  isApprover(role) {
    return role === 'Approver';
  }

  isAdmin(role) {
    return role === 'Admin';
  }

  canEditApplication(role, status) {
    if (this.isAdmin(role)) return true;
    if (status === 'Draft' && this.isRM(role)) return true;
    return false;
  }

  canEditAssumptions(role, status) {
    if (this.isAdmin(role)) return true;
    if ((status === 'Submitted' || status === 'In Review') && this.isAnalyst(role)) return true;
    return false;
  }

  canApprove(role) {
    return this.isApprover(role) || this.isAdmin(role);
  }
}

module.exports = new AuthService();

// Made with Bob
