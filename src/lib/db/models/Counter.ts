import mongoose, { Schema, Model } from 'mongoose';

interface CounterDocument {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter: Model<CounterDocument> =
  mongoose.models.Counter ?? mongoose.model<CounterDocument>('Counter', CounterSchema);

/** Atomically increment and return the next value for a named counter. */
export async function nextSeq(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return doc!.seq;
}
