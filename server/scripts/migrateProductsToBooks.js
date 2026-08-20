/**
 * MIGRATION SCRIPT: Products → Books
 *
 * Purpose: Migrate existing e-commerce 'products' collection to library 'books' collection
 * Date: 2026-01-21
 *
 * This script will:
 * 1. Rename collection from 'products' to 'books'
 * 2. Rename fields to match library terminology
 * 3. Remove e-commerce specific fields
 * 4. Add default values for new required fields
 * 5. Handle data validation
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Migration configuration
const BATCH_SIZE = 100;
const DRY_RUN = false; // Set to true to test without making changes

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

/**
 * Step 1: Rename collection from 'products' to 'books'
 */
async function renameCollection() {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: 'products' }).toArray();

        if (collections.length === 0) {
            console.log('⚠️  Collection "products" not found. Checking for "books"...');
            const booksExists = await db.listCollections({ name: 'books' }).toArray();
            if (booksExists.length > 0) {
                console.log('✅ Collection "books" already exists. Skipping rename.');
                return true;
            }
            console.log('❌ Neither "products" nor "books" collection found!');
            return false;
        }

        if (DRY_RUN) {
            console.log('🔍 [DRY RUN] Would rename collection: products → books');
            return true;
        }

        await db.collection('products').rename('books');
        console.log('✅ Collection renamed: products → books');
        return true;
    } catch (error) {
        if (error.codeName === 'NamespaceExists') {
            console.log('⚠️  Collection "books" already exists. Skipping rename.');
            return true;
        }
        console.error('❌ Error renaming collection:', error.message);
        return false;
    }
}

/**
 * Step 2: Migrate document fields
 */
async function migrateDocuments() {
    try {
        const db = mongoose.connection.db;
        const booksCollection = db.collection('books');

        // Count total documents
        const totalDocs = await booksCollection.countDocuments();
        console.log(`\n📊 Total documents to migrate: ${totalDocs}`);

        if (totalDocs === 0) {
            console.log('⚠️  No documents found to migrate');
            return true;
        }

        let processedCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process documents in batches
        const cursor = booksCollection.find({});

        while (await cursor.hasNext()) {
            const doc = await cursor.next();

            try {
                // Build update operations
                const updateOps = buildUpdateOperations(doc);

                if (DRY_RUN) {
                    console.log(`🔍 [DRY RUN] Would update document ${doc._id}:`, JSON.stringify(updateOps, null, 2));
                } else {
                    // Apply updates
                    await booksCollection.updateOne({ _id: doc._id }, updateOps);
                }

                processedCount++;

                // Progress indicator
                if (processedCount % 10 === 0) {
                    console.log(
                        `⏳ Progress: ${processedCount}/${totalDocs} (${((processedCount / totalDocs) * 100).toFixed(
                            1,
                        )}%)`,
                    );
                }
            } catch (error) {
                errorCount++;
                errors.push({ id: doc._id, error: error.message });
                console.error(`❌ Error migrating document ${doc._id}:`, error.message);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total documents: ${totalDocs}`);
        console.log(`✅ Successfully migrated: ${processedCount - errorCount}`);
        console.log(`❌ Failed: ${errorCount}`);

        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.forEach((err) => {
                console.log(`  - Document ${err.id}: ${err.error}`);
            });
        }

        return errorCount === 0;
    } catch (error) {
        console.error('❌ Error during migration:', error);
        return false;
    }
}

/**
 * Build update operations for a document
 */
function buildUpdateOperations(doc) {
    const $rename = {};
    const $unset = {};
    const $set = {};

    // ========================================
    // RENAME OPERATIONS (Priority 1 & 2)
    // ========================================

    // Core fields
    if (doc.nameProduct !== undefined) {
        $rename.nameProduct = 'title';
    }

    if (doc.price !== undefined) {
        $rename.price = 'dailyRentalFee';
    }

    if (doc.stock !== undefined) {
        $rename.stock = 'availableCopies';
    }

    if (doc.rentCount !== undefined) {
        $rename.rentCount = 'borrowCount';
    }

    if (doc.deposit !== undefined) {
        $rename.deposit = 'securityDeposit';
    }

    // ========================================
    // HANDLE QUANTITY → TOTALCOPIES
    // ========================================

    // If 'quantity' exists, rename it to 'totalCopies'
    if (doc.quantity !== undefined) {
        $rename.quantity = 'totalCopies';
    } else if (doc.stock !== undefined) {
        // If quantity doesn't exist, set totalCopies = stock
        $set.totalCopies = doc.stock;
    }

    // ========================================
    // REMOVE E-COMMERCE FIELDS (Priority 6)
    // ========================================

    if (doc.sku !== undefined) {
        $unset.sku = '';
    }

    if (doc.shipping !== undefined) {
        $unset.shipping = '';
    }

    if (doc.shippingAddress !== undefined) {
        $unset.shippingAddress = '';
    }

    if (doc.sold !== undefined) {
        $unset.sold = '';
    }

    if (doc.soldCount !== undefined) {
        $unset.soldCount = '';
    }

    // ========================================
    // SET DEFAULT VALUES FOR NEW FIELDS
    // ========================================

    // Author (if missing)
    if (!doc.author) {
        $set.author = 'Unknown Author';
    }

    // ISBN (if missing) - generate temporary ISBN
    if (!doc.isbn) {
        $set.isbn = `TEMP-ISBN-${doc._id.toString().toUpperCase()}`;
    }

    // Publication year (if missing)
    if (!doc.publicationYear) {
        $set.publicationYear = new Date().getFullYear();
    }

    // Publisher (if missing but have publishingHouse)
    if (!doc.publisher && doc.publishingHouse) {
        $set.publisher = doc.publishingHouse;
    } else if (!doc.publisher) {
        $set.publisher = 'Unknown Publisher';
    }

    // Publishing house (if missing but have publisher)
    if (!doc.publishingHouse && doc.publisher) {
        $set.publishingHouse = doc.publisher;
    } else if (!doc.publishingHouse) {
        $set.publishingHouse = 'Unknown Publishing House';
    }

    // Cover type (if missing)
    if (!doc.coverType) {
        $set.coverType = 'paperback';
    }

    // Ensure images array is not empty
    if (!doc.images || doc.images.length === 0) {
        $set.images = ['https://via.placeholder.com/300x400?text=No+Image'];
    }

    // Security deposit (if missing)
    if (doc.deposit === undefined && doc.securityDeposit === undefined) {
        $set.securityDeposit = 50000;
    }

    // Initialize counts if missing
    if (doc.viewCount === undefined) {
        $set.viewCount = 0;
    }

    if (doc.borrowCount === undefined && doc.rentCount === undefined) {
        $set.borrowCount = 0;
    }

    // Display order
    if (doc.displayOrder === undefined) {
        $set.displayOrder = 999999;
    }

    // ========================================
    // BUILD FINAL UPDATE OBJECT
    // ========================================

    const updateOps = {};

    if (Object.keys($rename).length > 0) {
        updateOps.$rename = $rename;
    }

    if (Object.keys($unset).length > 0) {
        updateOps.$unset = $unset;
    }

    if (Object.keys($set).length > 0) {
        updateOps.$set = $set;
    }

    return updateOps;
}

/**
 * Step 3: Update indexes
 */
async function updateIndexes() {
    try {
        const db = mongoose.connection.db;
        const booksCollection = db.collection('books');

        console.log('\n📑 Updating indexes...');

        // Drop old indexes
        const existingIndexes = await booksCollection.indexes();
        console.log(`Found ${existingIndexes.length} existing indexes`);

        for (const index of existingIndexes) {
            if (index.name !== '_id_') {
                // Skip the default _id index
                if (DRY_RUN) {
                    console.log(`🔍 [DRY RUN] Would drop index: ${index.name}`);
                } else {
                    try {
                        await booksCollection.dropIndex(index.name);
                        console.log(`✅ Dropped index: ${index.name}`);
                    } catch (error) {
                        console.log(`⚠️  Could not drop index ${index.name}: ${error.message}`);
                    }
                }
            }
        }

        if (DRY_RUN) {
            console.log('🔍 [DRY RUN] Would create new indexes from books.model.js');
            return true;
        }

        // New indexes will be created automatically by Mongoose when the model is loaded
        console.log('✅ Old indexes dropped. New indexes will be created by Mongoose on next server start.');

        return true;
    } catch (error) {
        console.error('❌ Error updating indexes:', error);
        return false;
    }
}

/**
 * Step 4: Verification
 */
async function verifyMigration() {
    try {
        const db = mongoose.connection.db;
        const booksCollection = db.collection('books');

        console.log('\n🔍 Verifying migration...');

        // Check for old field names
        const oldFields = await booksCollection.findOne({
            $or: [{ nameProduct: { $exists: true } }, { stock: { $exists: true } }, { price: { $exists: true } }],
        });

        if (oldFields) {
            console.log('⚠️  Warning: Found documents with old field names');
            console.log('Sample document:', oldFields._id);
            return false;
        }

        // Check for required fields
        const missingRequired = await booksCollection.findOne({
            $or: [
                { title: { $exists: false } },
                { author: { $exists: false } },
                { dailyRentalFee: { $exists: false } },
                { availableCopies: { $exists: false } },
            ],
        });

        if (missingRequired) {
            console.log('⚠️  Warning: Found documents missing required fields');
            console.log('Sample document:', missingRequired._id);
            return false;
        }

        // Get statistics
        const totalBooks = await booksCollection.countDocuments();
        const withISBN = await booksCollection.countDocuments({ isbn: { $exists: true, $ne: null } });
        const tempISBN = await booksCollection.countDocuments({ isbn: { $regex: /^TEMP-ISBN-/ } });

        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION RESULTS');
        console.log('='.repeat(60));
        console.log(`Total books: ${totalBooks}`);
        console.log(`With ISBN: ${withISBN} (${((withISBN / totalBooks) * 100).toFixed(1)}%)`);
        console.log(`With temporary ISBN: ${tempISBN}`);
        console.log('✅ Migration verification passed!');

        return true;
    } catch (error) {
        console.error('❌ Error during verification:', error);
        return false;
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('🚀 Starting Products → Books Migration');
    console.log('='.repeat(60));

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made');
        console.log('='.repeat(60));
    }

    try {
        // Step 0: Connect to database
        await connectDB();

        // Step 1: Rename collection
        console.log('\n📝 Step 1: Rename collection');
        const renameSuccess = await renameCollection();
        if (!renameSuccess) {
            throw new Error('Collection rename failed');
        }

        // Step 2: Migrate documents
        console.log('\n📝 Step 2: Migrate document fields');
        const migrateSuccess = await migrateDocuments();
        if (!migrateSuccess) {
            throw new Error('Document migration had errors');
        }

        // Step 3: Update indexes
        console.log('\n📝 Step 3: Update indexes');
        await updateIndexes();

        // Step 4: Verify migration
        console.log('\n📝 Step 4: Verify migration');
        const verifySuccess = await verifyMigration();

        if (verifySuccess) {
            console.log('\n' + '='.repeat(60));
            console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('='.repeat(60));
            console.log('\n📋 Next steps:');
            console.log('1. Restart your server to load the new books.model.js');
            console.log('2. Update controllers to use the new field names');
            console.log('3. Update frontend to use new API responses');
            console.log('4. Test thoroughly before deploying to production');
        }
    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error.message);
        console.error('Please fix the errors and try again.');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
