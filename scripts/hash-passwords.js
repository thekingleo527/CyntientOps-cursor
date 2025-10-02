#!/usr/bin/env node

/**
 * 🔐 Password Hashing Script
 * Purpose: Hash all passwords in workers.json for secure storage
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const SALT_ROUNDS = 12;

async function hashPasswords() {
  try {
    console.log('🔐 Starting password hashing process...');
    
    // Read workers.json
    const workersPath = path.join(__dirname, '../packages/data-seed/src/workers.json');
    const workersData = JSON.parse(fs.readFileSync(workersPath, 'utf8'));
    
    console.log(`📋 Found ${workersData.length} workers to process`);
    
    // Hash passwords for each worker
    for (let i = 0; i < workersData.length; i++) {
      const worker = workersData[i];
      const plainPassword = worker.password;
      
      console.log(`🔒 Hashing password for ${worker.name}...`);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      
      // Update the worker data
      workersData[i].password = hashedPassword;
      
      console.log(`✅ Password hashed for ${worker.name}`);
    }
    
    // Write back to file
    fs.writeFileSync(workersPath, JSON.stringify(workersData, null, 2));
    
    console.log('🎉 All passwords have been successfully hashed!');
    console.log('⚠️  Remember to delete the SECURE_USER_CREDENTIALS.md file after distributing credentials');
    
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
    process.exit(1);
  }
}

// Run the script
hashPasswords();
