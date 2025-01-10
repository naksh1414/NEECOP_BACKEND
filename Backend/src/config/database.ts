import mongoose from "mongoose";

export const connectToDatabase = async (): Promise<void> => {
  mongoose
    .connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/your-db-name"
    )
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
};
