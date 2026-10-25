import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { putItem, queryGSI } from '../db/dynamodb';
import { UserEntity } from '../routes/auth.routes';

async function createSuperAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@bakery.com').trim().toLowerCase();
  const password = args[1] || 'Admin@123';
  const name = args[2] || 'Super Admin';
  const phone = args[3] || '+92-300-1234567';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Bakery App - Super Admin Creator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`👤 Name:     ${name}`);
  console.log(`📱 Phone:    ${phone}`);
  console.log('──────────────────────────────────────────────');

  try {
    const existingUsers = await queryGSI<UserEntity>(`USER_EMAIL#${email}`);
    const passwordHash = await bcrypt.hash(password, 10);

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      const updatedUser: UserEntity = {
        ...existing,
        name,
        passwordHash,
        phone,
        role: 'ADMIN',
      };
      await putItem(updatedUser);
      console.log('✨ Existing user updated to SUPER ADMIN successfully!');
    } else {
      const adminId = uuidv4();
      const newAdmin: UserEntity = {
        PK: `USER#${adminId}`,
        SK: 'METADATA',
        GSI1PK: `USER_EMAIL#${email}`,
        GSI1SK: `USER#${adminId}`,
        id: adminId,
        email,
        name,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || 'Admin',
        passwordHash,
        phone,
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      };
      await putItem(newAdmin);
      console.log('🎉 New SUPER ADMIN account created successfully!');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LOGIN CREDENTIALS:');
    console.log(`   URL:      http://localhost:4201  (Admin Portal)`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     ADMIN`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error: any) {
    console.error('❌ Failed to create super admin:', error.message || error);
    if (error.name === 'ResourceNotFoundException' || error.message?.includes('Cannot do operations on a non-existent table')) {
      console.log('\n💡 Note: DynamoDB table "BakeryTable" AWS par ya local endpoint par mojood nahi hai.');
      console.log('   Pehle "npm run deploy:all" chalayein taake DynamoDB table ban jaye,');
      console.log('   ya agar local DynamoDB use kar rahe hain to DYNAMODB_ENDPOINT set karein.');
    }
  }
}

createSuperAdmin();
