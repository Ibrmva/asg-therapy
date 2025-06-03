// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "path";

// import { connectDB } from "./db/connectDB.js";

// import authRoutes from "./routes/auth.route.js";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;
// const __dirname = path.resolve();

// app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// app.use(express.json()); 
// app.use(cookieParser());

// app.use("/api/auth", authRoutes);

// if (process.env.NODE_ENV === "production") {
// 	app.use(express.static(path.join(__dirname, "/frontend/dist")));

// 	app.get("*", (req, res) => {
// 		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
// 	});
// }

// const mongoUri = process.env.MONGO_URI;
// if (!mongoUri) {
// 	console.error("Error: MongoDB connection URI environment variable is not set.");
// 	process.exit(1);
// }

// connectDB(mongoUri).then(() => {
// 	app.listen(PORT, () => {
// 		console.log("Server is running on port: ", PORT);
// 	});
// }).catch((error) => {
// 	console.error("Error connecting to MongoDB:", error);
// 	process.exit(1);
// });
