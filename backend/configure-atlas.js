// Quick MongoDB Atlas Configuration Helper
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 MongoDB Atlas Configuration Helper');
console.log('======================================\n');

rl.question('Enter your MongoDB Atlas connection string:\n> ', (connectionString) => {
  if (!connectionString || !connectionString.trim()) {
    console.log('\n❌ No connection string provided. Exiting.');
    rl.close();
    process.exit(1);
  }

  // Ensure connection string has database name
  let mongoURI = connectionString.trim();
  if (!mongoURI.includes('/taxiwale')) {
    // Add database name if not present
    if (mongoURI.includes('?')) {
      mongoURI = mongoURI.replace('?', '/taxiwale?');
    } else {
      mongoURI = mongoURI + '/taxiwale';
    }
  }

  // Create .env content
  const envContent = `PORT=5000
NODE_ENV=development
MONGODB_URI=${mongoURI}
JWT_SECRET=taxiwale-super-secret-jwt-key-for-development-only-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
`;

  // Write .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('\n✅ .env file created/updated successfully!');
  console.log(`\n📝 Connection string saved to: ${envPath}`);
  
  // Test connection
  console.log('\n🧪 Testing connection...\n');
  
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log('\n🎉 Setup complete! Your backend is ready to use.');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Check server logs for connection confirmation');
    console.log('   3. Start using the API!');
    mongoose.connection.close();
    rl.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Connection failed:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check username and password are correct');
    console.error('   2. Verify IP address is allowed in Network Access');
    console.error('   3. Make sure cluster is fully created (green status)');
    console.error('   4. Check connection string format');
    console.error('\n📖 See: backend/ATLAS_SETUP_GUIDE.md for help');
    rl.close();
    process.exit(1);
  });
});

