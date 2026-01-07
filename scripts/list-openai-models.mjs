#!/usr/bin/env node
import OpenAI from "openai";

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("Please set OPENAI_API_KEY in the environment before running this script.");
    process.exit(1);
  }

  try {
    const client = new OpenAI({ apiKey: key });
    console.log("Listing available models for this API key (first 200):\n");
    const res = await client.models.list();
    if (!res || !res.data) {
      console.error("No models returned.");
      process.exit(1);
    }
    // Print id and optionally description
    res.data.slice(0, 200).forEach((m) => {
      console.log(m.id);
    });
  } catch (err) {
    console.error("Error listing models:", err.message || err);
    process.exit(1);
  }
}

main();
