const mongoose = require('mongoose');
const User = require('./models/User');
const { mongoUri } = require('./config/config');

const checkUsers = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const testEmails = [
      'john.employee@company.com',
      'jane.manager@company.com',
      'bob.finance@company.com',
      'alice.admin@company.com',
    ];

    console.log('\n=== Checking Seeded Users ===\n');

    for (const email of testEmails) {
      const user = await User.findOne({ email }).select('+password');
      
      if (user) {
        console.log(`✓ ${email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Employee ID: ${user.employeeId}`);
        console.log(`  Active: ${user.isActive}`);
        console.log(`  Manager: ${user.managerId ? 'Yes' : 'No'}`);
        console.log(`  Password hash exists: ${user.password ? 'Yes' : 'No'}`);
        
        // Test password comparison
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare('password123', user.password);
        console.log(`  Password comparison (password123): ${isMatch ? 'PASS' : 'FAIL'}`);
      } else {
        console.log(`✗ ${email} - NOT FOUND`);
      }
      console.log('');
    }

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`\nTotal users in database: ${totalUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
