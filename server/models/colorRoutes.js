import express from 'express';
import Color from './colorModel.js';  // Importing Color model

const router = express.Router();

// POST route to add a new color
router.post('/add', async (req, res) => {
  try {
    const { name, hex } = req.body;
    const newColor = new Color({ name, hex });
    await newColor.save();
    res.status(201).json(newColor);
  } catch (error) {
    console.error('Error adding color:', error);
    res.status(500).send('Error adding color');
  }
});

// GET route to fetch all colors
router.get('/', async (req, res) => {
    console.log('Fetching all colors');  // Add this for debugging
    try {
      const colors = await Color.find();
      res.status(200).json(colors);
    } catch (error) {
      console.error('Error fetching colors:', error);
      res.status(500).send('Error fetching colors');
    }
  });

export default router;  // Exporting router in ES module syntax
