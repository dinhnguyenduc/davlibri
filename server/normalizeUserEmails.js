const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/users.model');

const removeDigitsFromLocalPart = (email) => {
    const [localPart, domain] = String(email).toLowerCase().split('@');
    const asciiLocalPart = localPart
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z._-]/g, '')
        .replace(/[0-9]/g, '');
    const asciiDomain = domain
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
    return `${asciiLocalPart}@${asciiDomain}`;
};

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({ role: { $ne: 'admin' } }).select('_id email role');
    const allUsers = await User.find().select('_id email');
    const existingEmails = new Set(allUsers.map((user) => user.email.toLowerCase()));
    const sourceEmails = new Set(users.map((user) => user.email.toLowerCase()));
    const targetCounts = new Map();
    const changes = [];

    for (const user of users) {
        const normalizedEmail = removeDigitsFromLocalPart(user.email);
        if (normalizedEmail === user.email.toLowerCase()) continue;

        targetCounts.set(normalizedEmail, (targetCounts.get(normalizedEmail) || 0) + 1);
        const collision = existingEmails.has(normalizedEmail) && normalizedEmail !== user.email.toLowerCase();

        changes.push({
            id: user._id.toString(),
            from: user.email,
            to: normalizedEmail,
            collision,
        });
    }

    changes.forEach((change) => {
        change.collision =
            change.collision ||
            targetCounts.get(change.to) > 1 ||
            (sourceEmails.has(change.to) && change.from.toLowerCase() !== change.to);
    });

    console.table(changes);

    if (process.argv.includes('--apply')) {
        const safeChanges = changes.filter((change) => !change.collision && change.from.toLowerCase() !== change.to);
        for (const change of safeChanges) {
            await User.updateOne({ _id: change.id }, { $set: { email: change.to } });
        }
        console.log(`Updated ${safeChanges.length} non-admin account email(s).`);
        console.log('Accounts with collisions were skipped and require manual resolution.');
    } else {
        console.log('Preview only. Re-run with --apply to update non-admin emails.');
    }

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
});
