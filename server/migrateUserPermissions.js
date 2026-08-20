const mongoose = require('mongoose');
const modelUser = require('./src/models/users.model');
require('dotenv').config();

/**
 * Migration script để thêm permissions field cho users hiện có
 */
async function migrateUserPermissions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Cập nhật tất cả users chưa có permissions field
        const result = await modelUser.updateMany({ permissions: { $exists: false } }, { $set: { permissions: [] } });

        console.log(`✅ Updated ${result.modifiedCount} users with permissions field`);

        // Hiển thị thống kê users theo role
        const stats = await modelUser.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                },
            },
        ]);

        console.log('\n📊 User Statistics:');
        stats.forEach((stat) => {
            console.log(`   ${stat._id}: ${stat.count} users`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Chạy migration
migrateUserPermissions();
