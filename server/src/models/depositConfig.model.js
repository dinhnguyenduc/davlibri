const mongoose = require('mongoose');

const { Schema } = mongoose;

const depositConfigSchema = new Schema(
    {
        globalDeposit: { type: Number, default: 50000 },
        useGlobalDeposit: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('depositConfig', depositConfigSchema);
