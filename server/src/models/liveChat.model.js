const mongoose = require('mongoose');

const { Schema } = mongoose;

const liveChatSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
        librarianId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
        status: {
            type: String,
            enum: ['waiting', 'active', 'closed'],
            default: 'waiting',
        },
        messages: [
            {
                senderId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
                senderRole: { type: String, enum: ['user', 'librarian'], required: true },
                message: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                read: { type: Boolean, default: false },
            },
        ],
        startedAt: { type: Date, default: Date.now },
        assignedAt: { type: Date },
        closedAt: { type: Date },
        rating: { type: Number, min: 1, max: 5 },
        feedback: { type: String },
    },
    {
        timestamps: true,
    },
);

// Index để tìm kiếm nhanh
liveChatSchema.index({ userId: 1, status: 1 });
liveChatSchema.index({ librarianId: 1, status: 1 });
liveChatSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('liveChats', liveChatSchema);
