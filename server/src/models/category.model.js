const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema(
    {
        nameCategory: { type: String, require: true },
        deposit: { type: Number, default: 50000 },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('category', categorySchema);
