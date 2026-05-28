import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

export const CALIBRATION_MODES = ['interests', 'looks'] as const;

/**
 * Calibration swipes from the Discover screen.
 *
 * These are NOT matches — they're independent signals trained into the ML model:
 *   - 'interests' mode trains on activity/lifestyle preferences
 *   - 'looks' mode trains on appearance preferences
 *
 * The two are deliberately uncorrelated at the data layer.
 */
const swipeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Card identifier from the calibration deck (e.g. 'int_03', 'look_07').
    // Not a foreign key — calibration cards may not be persisted as users.
    cardId: { type: String, required: true, index: true },

    mode: { type: String, enum: CALIBRATION_MODES, required: true },

    liked: { type: Boolean, required: true },

    // How long the user took to decide after the card was shown.
    // Fast (<1.5s) suggests gut reaction; slow (>5s) suggests deliberation.
    // Both are signal for the model.
    responseTimeMs: { type: Number, default: null, min: 0 },

    swipedAt: { type: Date, default: () => new Date(), required: true },
  },
  { timestamps: true }
);

// Common query: get all swipes for a user in a given mode.
swipeSchema.index({ userId: 1, mode: 1, swipedAt: -1 });

swipeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>)._id;
  },
});

export type Swipe = InferSchemaType<typeof swipeSchema>;
export type SwipeDoc = HydratedDocument<Swipe>;
export const SwipeModel = model('Swipe', swipeSchema);
