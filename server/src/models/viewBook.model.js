const mongoose = require('mongoose');

const { Schema } = mongoose;

const viewBookSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
        bookId: { type: Schema.Types.ObjectId, ref: 'books', required: true },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('viewBook', viewBookSchema);
