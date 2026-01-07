#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("Please set GEMINI_API_KEY in the environment before running this script.");
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI({ apiKey: key });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("Sending test prompt to gemini-1.5-flash...");

    const result = await model.generateContent(["Say hello in one word"]);
    const response = await result.response;
    const text = await response.text();

    console.log("--- API response text ---");
    console.log(text);
    console.log("--- end response ---");
  } catch (err) {
    console.error("Error while calling Generative API:", err);
    if (err.response) {
      try {
        const body = await err.response.text();
        console.error("Response body:", body);
      } catch (e) {
        // ignore
      }
    }
    process.exit(1);
  }
}

main();
