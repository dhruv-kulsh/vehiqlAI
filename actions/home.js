"use server"

import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import aj from "@/lib/arcjet";
import { serializedCarData } from "@/lib/helper";

export async function getFeaturedCars(limit = 3) {
    try {
        const cars = await db.car.findMany({
            where: {
                featured: true,
                status: "AVAILABLE",
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return cars.map(serializedCarData);
    } catch (error) {
        throw new Error("Error fetching featured cars:" + error.message);
    }
};

async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
}

export async function processImageSearch(file) {
    try {
        // Rate limitting with Arcjet
        const req = await request();

        const decision = await aj.protect(req, {
            requested: 1,
        })

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                const { remaining, reset } = decision.reason;


                console.error({
                    code: "RATE_LIMIT_EXCEEDED",
                    details: {
                        remaining,
                        resetInSeconds: reset
                    }
                })

                throw new Error("Too many request. Please try again later")
            }
            throw new Error("Request Blocked")

        }



        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            apiVersion: "v1",
        });

        const base64Image = await fileToBase64(file);

        const prompt = `
      Analyze this car image and extract the following information for a search query:
      1. Make (manufacturer)
      2. Body type (SUV, Sedan, Hatchback, etc.)
      3. Color

      Format your response as a clean JSON object with these fields:
      {
        "make": "",
        "bodyType": "",
        "color": "",
        "confidence": 0.0
      }

      For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
      Only respond with the JSON object, nothing else.
    `;

        const result = await ai.models.generateContent({
            model: "models/gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Image,
                                mimeType: file.type,
                            },
                        },
                    ],
                },
            ],
        });

        const text = result.text;

        const cleanedText = text.replace(/```(?:json)?/g, "").trim();
        console.log("cleanedText", cleanedText);

        try {
            const carDetails = JSON.parse(cleanedText);

            return {
                success: true,
                data: carDetails
            }
        } catch (error) {
            console.error("Failed to parse AI response", error)
            return {
                success: false,
                error: "Failed to parse AI response"
            }
        }

    } catch (error) {
        throw new Error("AI Search error" + error.message)
    }
}