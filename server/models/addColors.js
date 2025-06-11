import express from 'express';
import Color from './colorModel.js';

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { name, hex } = req.body;
    const newColor = new Color({
      name,
      hex,
    });

    await newColor.save();
    res.status(201).json(newColor);
  } catch (error) {
    console.error('Error adding color:', error);
    res.status(500).send('Error adding color');
  }
});

router.get('/', async (req, res) => {
  try {
    const colors = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).send('Error fetching colors');
  }
});

export default router;
