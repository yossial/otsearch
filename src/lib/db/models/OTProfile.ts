import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Specialisation,
  InsuranceType,
  SessionType,
  SubscriptionTier,
} from '@/types';

export interface OTProfileDocument extends Document {
  slug: string;
  displayName: { he: string; ar: string; en: string };
  bio: { he: string; ar: string; en: string };
  photo: string | null;
  mohRegistrationNumber: string;
  specialisations: Specialisation[];
  languages: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    city: string;
    address: string;
  };
  sessionTypes: SessionType[];
  insuranceAccepted: InsuranceType[];
  feeRange: { min: number; max: number; currency: 'ILS' } | null;
  contactEmail: string;
  contactPhone: string;
  subscriptionTier: SubscriptionTier;
  isFeatured: boolean;
  isAcceptingPatients: boolean;
  isActive: boolean;
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
}

const MultilingualSchema = new Schema(
  { he: { type: String, required: true }, ar: String, en: String },
  { _id: false }
);

const OTProfileSchema = new Schema<OTProfileDocument>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: MultilingualSchema, required: true },
    bio: { type: MultilingualSchema, required: true },
    photo: { type: String, default: null },
    mohRegistrationNumber: { type: String, required: true },
    specialisations: {
      type: [String],
      enum: [
        'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
        'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
      ],
    },
    languages: [String],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], index: '2dsphere' },
      city: String,
      address: String,
    },
    sessionTypes: {
      type: [String],
      enum: ['in-person', 'telehealth', 'home-visit'],
    },
    insuranceAccepted: {
      type: [String],
      enum: ['clalit', 'maccabi', 'meuhedet', 'leumit', 'private'],
    },
    feeRange: {
      type: new Schema(
        { min: Number, max: Number, currency: { type: String, default: 'ILS' } },
        { _id: false }
      ),
      default: null,
    },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: { type: String, required: true },
    subscriptionTier: { type: String, enum: ['free', 'premium'], default: 'free' },
    isFeatured: { type: Boolean, default: false },
    isAcceptingPatients: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    profileViews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text search index — covers name + bio in he and en
OTProfileSchema.index(
  {
    'displayName.he': 'text',
    'displayName.en': 'text',
    'bio.he': 'text',
    'bio.en': 'text',
    'location.city': 'text',
  },
  { weights: { 'displayName.he': 10, 'displayName.en': 10, 'location.city': 5 } }
);

// Geospatial index on location
OTProfileSchema.index({ location: '2dsphere' });

export const OTProfile: Model<OTProfileDocument> =
  mongoose.models.OTProfile ??
  mongoose.model<OTProfileDocument>('OTProfile', OTProfileSchema);
