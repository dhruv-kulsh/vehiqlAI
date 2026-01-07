import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
//   key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // Tracked by IP address by default, but this can be customized
      // See https://docs.arcjet.com/fingerprints
      //characteristics: ["ip.src"],
      refillRate: 10, // refill 10 tokens per interval
      interval: 36000, // 60 second interval
      capacity: 10, // bucket maximum capacity of 100 tokens
    }),
  ],
});

export default aj;