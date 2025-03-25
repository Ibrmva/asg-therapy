import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import colorRoutes from './models/colorRoutes.js';  // Importing the colorRoutes with ES6 syntax

const app = express();
const port = 5001;

app.use(cors());  // Enable CORS for all routes

mongoose.connect('mongodb://localhost:27017/colors')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err);
  });

app.use(express.json());

app.use('/colors', colorRoutes);  // Using colorRoutes as middleware

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
