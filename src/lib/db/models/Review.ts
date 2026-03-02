import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ReviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  otProfileId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    otProfileId: { type: Schema.Types.ObjectId, ref: 'OTProfile', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'Rating must be an integer' },
    },
    text: { type: String, required: true, minlength: 20, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per user per OT
ReviewSchema.index({ userId: 1, otProfileId: 1 }, { unique: true });
// Fast paginated listing of approved reviews for a given OT
ReviewSchema.index({ otProfileId: 1, isApproved: 1, createdAt: -1 });

export const Review: Model<ReviewDocument> =
  mongoose.models.Review ?? mongoose.model<ReviewDocument>('Review', ReviewSchema);
