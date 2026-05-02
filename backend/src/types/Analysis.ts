import mongoose from "mongoose";

export interface AnalysisBase {
  userId: string;
  audioFile: mongoose.Schema.Types.ObjectId;
  result: string;
  createdAt: Date;
}

// For instance methods
export interface AnalysisDocument extends mongoose.Document, AnalysisBase {}

// For static methods
export interface AnalysisModel extends mongoose.Model<AnalysisDocument> {}
