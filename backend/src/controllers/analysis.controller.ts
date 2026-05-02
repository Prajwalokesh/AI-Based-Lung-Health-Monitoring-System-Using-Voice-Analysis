import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod/v4";
import { sendError, sendSuccess } from "../utils/sendResponse";
import {
  deleteAnalysisParamsSchema,
  historyQuerySchema,
  recommendationSchema,
} from "../schema/analysis.schema";
import Analysis from "../models/Analysis.model";
import AudioFile from "../models/AudioFile.model";
import FormData from "form-data";

export async function getRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { success, error } = recommendationSchema.safeParse(req.body);

  if (!success) {
    return sendError(
      res,
      "Invalid request!",
      z.flattenError(error).fieldErrors,
      400,
    );
  }

  const file = req.file;

  if (!file) {
    return sendError(
      res,
      "Audio file is needed",
      "No audio file is given!",
      404,
    );
  }

  const useDatabase = mongoose.connection.readyState === 1;
  const modelBaseUrl = process.env.MODEL_BASE_URL || "http://127.0.0.1:8001";

  try {
    const formData = new FormData();
    formData.append(
      "file",
      fsSync.createReadStream(`./src/uploads/${file.filename}`),
    );

    const modelResponse = await axios.post(
      `${modelBaseUrl}/predict-health`,
      formData,
      { headers: formData.getHeaders() },
    );

    const response = modelResponse.data;

    if (!useDatabase) {
      await fs.rm(`./src/uploads/${file.filename}`);
      return sendSuccess(
        res,
        "Analysis completed successfully!",
        {
          result: response?.prediction ?? response,
        },
        200,
      );
    }

    const savedFile = await AudioFile.insertOne({
      originalFileName: file.originalname,
      fileId: path.parse(file.filename).name,
      userId: req.userId || "guest",
    });
    const analysisRecord = await Analysis.insertOne({
      userId: req.userId || "guest",
      audioFile: savedFile._id,
      result:
        response?.prediction?.predicted_label ??
        response?.prediction?.predictedLabel ??
        response?.prediction?.predicted_index ??
        response?.prediction ??
        response,
    });

    const responseData = {
      audioFile: {
        originalFileName: savedFile.originalFileName,
        fileEndpoint: savedFile.audioEndPoint,
        fileId: savedFile.fileId,
        createdAt: savedFile.createdAt,
      },
      result: analysisRecord.result,
    };

    return sendSuccess(
      res,
      "Audio file saved successfully!",
      {
        ...responseData,
        result: response?.prediction ?? response,
      },
      201,
    );
  } catch (error) {
    await fs.rm(`./src/uploads/${file.filename}`);
    return next(error);
  }
}

export async function getAnalysisHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { success, data, error } = historyQuerySchema.safeParse(req.query);

    if (!success) {
      return sendError(
        res,
        "Invalid query parameters",
        z.flattenError(error).fieldErrors,
        400,
      );
    }

    const { page, limit, sortBy, sortOrder } = data;
    const skip = (page - 1) * limit;
    const validatedLimit = Math.min(limit, 50);
    const sortOptions: any = {};

    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const totalDocuments = await Analysis.countDocuments({
      userId: req.userId,
    });

    const totalPages = Math.ceil(totalDocuments / validatedLimit);
    const histories = await Analysis.find({ userId: req.userId })
      .sort(sortOptions)
      .skip(skip)
      .limit(validatedLimit)
      .populate("audioFile", "-__v")
      .select("-__v")
      .lean();

    const formattedHistories = histories.map((history) => history);

    const pagination = {
      currentPage: page,
      totalPages,
      totalDocuments,
      limit: validatedLimit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      skip,
      documentsInCurrentPage: histories.length,
    };

    const responseData = {
      histories: formattedHistories,
      pagination,
    };

    return sendSuccess(res, "All Your Analysis Sessions", responseData, 200);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAnalysisHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { success, data, error } = deleteAnalysisParamsSchema.safeParse(
    req.params,
  );

  if (!success) {
    return sendError(
      res,
      "Invalid request!",
      z.flattenError(error).fieldErrors,
      400,
    );
  }

  const { analysisId } = data;
  const mongoSession = await mongoose.startSession();

  try {
    mongoSession.startTransaction();

    const analysisRecord = await Analysis.findByIdAndDelete(analysisId);

    if (!analysisRecord) {
      return sendError(
        res,
        "No Such records found to delete!",
        "No such records",
        404,
      );
    }

    const audioFile = await AudioFile.findByIdAndDelete(
      analysisRecord.audioFile,
    );

    if (!audioFile) {
      return sendError(
        res,
        "No Such records found to delete!",
        "No such records",
        404,
      );
    }

    await fs.rm(`./src/uploads/${audioFile.filename}`);
    await mongoSession.commitTransaction();

    return sendSuccess(res, "Analysis Record Deleted Successfully!", null, 200);
  } catch (error) {
    await mongoSession.abortTransaction();
    return next(error);
  }
}
