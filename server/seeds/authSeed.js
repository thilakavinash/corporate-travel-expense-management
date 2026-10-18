const mongoose = require('mongoose');
const User = require('../models/User');
const { mongoUri } = require('../config/config');

const seedUsers = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define test users with plain text passwords (will be hashed by pre-save hook)
    const testUsers = [
      {
        firstName: 'Jane',
        lastName: 'Manager',
        email: 'jane.manager@company.com',
        password: 'password123',
        role: 'manager',
        department: 'Engineering',
        employeeId: 'MGR001',
      },
      {
        firstName: 'Bob',
        lastName: 'Finance',
        email: 'bob.finance@company.com',
        password: 'password123',
        role: 'finance',
        department: 'Finance',
        employeeId: 'FIN001',
      },
      {
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'alice.admin@company.com',
        password: 'password123',
        role: 'admin',
        department: 'IT',
        employeeId: 'ADM001',
      },
      {
        firstName: 'John',
        lastName: 'Employee',
        email: 'john.employee@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        employeeId: 'EMP001',
        managerId: null, // Will be set after manager is created
      },
    ];

    // Create or update users to avoid duplicates
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ employeeId: userData.employeeId });

      if (existingUser) {
        console.log(`User with employeeId ${userData.employeeId} already exists, skipping...`);
        continue;
      }

      await User.create(userData);
      console.log(`Created user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
    }

    // Set manager relationship for employee
    const manager = await User.findOne({ employeeId: 'MGR001' });
    const employee = await User.findOne({ employeeId: 'EMP001' });

    if (manager && employee && !employee.managerId) {
      employee.managerId = manager._id;
      await employee.save();
      console.log(`Set ${manager.firstName} ${manager.lastName} as manager for ${employee.firstName} ${employee.lastName}`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest Users Created:');
    console.log('Manager: jane.manager@company.com / password123');
    console.log('Finance: bob.finance@company.com / password123');
    console.log('Admin: alice.admin@company.com / password123');
    console.log('Employee: john.employee@company.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedUsers();
