import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://localhost:27017/mongo-pos"; // Replace with your MongoDB connection string

export async function connectDB() {


  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Don't exit process in Replit, just log error, as it might be transient or configuration issue
    // but for a robust app we might want to fail hard.
  }
}
