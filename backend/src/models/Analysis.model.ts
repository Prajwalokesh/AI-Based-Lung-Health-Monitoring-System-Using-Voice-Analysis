import mongoose from "mongoose";
import { AnalysisDocument, AnalysisModel } from "../types/Analysis";

const analysisSchema = new mongoose.Schema<AnalysisDocument, AnalysisModel>(
  {
    userId: {
      type: String,
      required: true,
    },
    audioFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AudioFile",
      required: true,
    },
    result: {
      type: String,
      default: "Default Result!",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: "throw",
  },
);

const Analysis = mongoose.model<AnalysisDocument, AnalysisModel>(
  "Analysis",
  analysisSchema,
);
export default Analysis;
