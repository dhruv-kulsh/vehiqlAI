"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase.js";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid"
import { serializedCarData } from "@/lib/helper";

async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString("base64");
}

export async function processCarImageWithAI(file) {
    // console.log("inside processCarImageWithAI");

    try {

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API key is not configured");
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            apiVersion: "v1",
        });

        const base64Image = await fileToBase64(file);

        const prompt = `
            Analyse the car image and extract the following information:
                1. Make (Manufacturer)
                2. Model
                3. Year (approximately)
                4. Color
                5. Body Type (SUV, Sedan, Hatchback, etc)
                6. Milage
                7. Fuel Type (Your best guess)
                8. Transmission type (your best guess)
                9. Price (your best guess)
                10. short Description as to be added to a car listing
            
            Format your response as a clean JSON object with these fields:
                {
                    "make": "",
                    "model": "",
                    "year": 0000,
                    "color": "",
                    "price": "",
                    "mileage": "",
                    "bodyType": "",
                    "fuelType": "",
                    "transmission": "",
                    "description": "",
                    "confidence": ""
                }

                For a confidence. provide a value between 0 and 1 representing the confidence
                you are in overall identification
                Only respond with the JSON object, nothing else.
        `;

        // const avail_models = await ai.models.list();
        // console.log(avail_models);

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

            const requiredField = [
                "make",
                "model",
                "year",
                "color",
                "bodyType",
                "price",
                "mileage",
                "fuelType",
                "transmission",
                "description",
                "confidence"
            ];

            const missingFields = requiredField.filter(
                (field) => !(field in carDetails)
            );

            if (missingFields.length > 0) {
                throw new Error(
                    `AI response missing required fields: ${missingFields.join(", ")}`
                );
            }
            return {
                success: true,
                data: carDetails
            };
        } catch (error) {
            console.error("Failed to parse AI response", error);
            return {
                success: false,
                error: "Failed to Parse AI response"
            };
        }
    } catch (error) {
        throw new Error("Gemini API Error: " + error.message);
    }
}



export async function addCar({ carData, images }) {
    try {
        console.log("Reaching serveraction");

        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorised");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User Not found");

        const carId = uuidv4();
        const folderPath = `cars/${carId}`;

        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const imageURLs = [];

        for (let i = 0; i < images.length; i++) {
            const base64Data = images[i];

            // Skip if image data is not valid
            if (!base64Data || !base64Data.startsWith("data:image/")) {
                console.warn("Skipping invalid image data");
                continue;
            }

            // Extract the base64 part (remove the data:image/xyz;base64, prefix)
            const base64 = base64Data.split(",")[1];
            const imageBuffer = Buffer.from(base64, "base64");

            // Determine the file extension from the data URL
            const mimiMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/)
            const fileExtension = mimiMatch ? mimiMatch[1] : "jpeg"

            // Create filename
            const fileName = `image-${Date.now()}-${i}.${fileExtension}`
            const filePath = `${folderPath}/${fileName}`

            const { data, error } = await supabase.storage
                .from("car-images")
                .upload(filePath, imageBuffer, {
                    contentType: `image/${fileExtension}`,
                });

            if (error) {
                console.error("Error uploading image", error);
                throw new Error(`Failed to upload image: ${error.message}`)
            }
            console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

            console.log(filePath);
            
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;
            console.log("publicUrl", publicUrl);
            
            imageURLs.push(publicUrl)
        }

        if (imageURLs.length === 0) {
            throw new Error("No valid images were uploaded");
        }

        console.log(imageURLs);
        

        const car = await db.car.create(
            {
                data: {
                    id: carId,
                    make: carData.make,
                    model: carData.model,
                    year: carData.year,
                    price: carData.price,
                    mileage: carData.mileage,
                    color: carData.color,
                    fuelType: carData.fuelType,
                    transmission: carData.transmission,
                    bodyType: carData.bodyType,
                    seats: carData.seats,
                    description: carData.description,
                    status: carData.status,
                    featured: carData.featured,
                    images: imageURLs
                }
            }
        )

        revalidatePath('/admin/cars');

        return ({
            success: true,
        })

    } catch (error) {
        throw new Error("Error Adding car:" + error.message);
    }
}


export async function getCars(search = "") {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorised");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User Not found");

        let where = {};

        if (search) {
            where.OR = [
                { make: { contains: search, mode: "insensetive" } },
                { model: { contains: search, mode: "insensetive" } },
                { color: { contains: search, mode: "insensetive" } },
            ]
        }

        const cars = await db.car.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        const serializedcars = cars.map(serializedCarData);
        return {
            success: true,
            data: serializedcars
        }

    } catch (error) {
        console.error("Error fetching cars", error);
        return {
            success: false,
            error: error.message
        }
    }
}

export async function deleteCar(id) {
    try {


        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorised");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User Not found");

        const car = await db.car.findUnique({
            where: { id },
            select: { images: true }
        })

        if (!car) {
            return {
                success: false,
                error: "Car not found"
            }
        }

        await db.car.delete({
            where: { id }
        })

        try {
            const cookieStore = await cookies();
            const supabase = createClient(cookieStore);

            const filePaths = car.images
                .map((imageUrl) => {
                    const url = new URL(imageUrl);
                    const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
                    return pathMatch ? pathMatch[1] : null;
                })
                .filter(Boolean);

            if (filePaths.length > 0) {
                const { error } = await supabase.storage
                    .from("car-images")
                    .remove(filePaths);

                if (error) {
                    console.error("Error deleting images", error)
                }

            }
        } catch (storageError) {
            console.error("Error with storage operations", storageError)
        }

        revalidatePath("/admin/cars");

        return {
            success: true,
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        }
    }


}

export async function updateCarStatus(id, { status, featured }) {
    try {


        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorised");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User Not found");

        const updatedData = {};

        if (status !== undefined) {
            updatedData.status = status;
        }

        if (featured !== undefined) {
            updatedData.featured = featured
        }

        await db.car.update({
            where: { id },
            data: updatedData
        })

        revalidatePath("/admin/cars");
        return {
            success: true
        }
    }
    catch (error) {
        console.error("Error updating car status", error);
        return {
            success: false,
            error: error.message
        }
    }
}