import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import potrace from 'potrace';
import sharp from 'sharp';
import { kmeans } from 'ml-kmeans';
import fileUpload from 'express-fileupload';
import vtracer from 'vtracer';


dotenv.config();

const app = express();


// CORS options
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));  // Parse large JSON payloads
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));  // Adjust file upload size limit


if (!process.env.VITE_OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not defined in the .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Extract dominant colors from the image
const extractDominantColors = async (imgBuffer, numColors = 24) => {
  try {
    const resizedImage = await sharp(imgBuffer)
      .resize(100, 100)
      .toFormat('raw')
      .raw()
      .toBuffer();

    const pixels = [];
    for (let i = 0; i < resizedImage.length; i += 3) {
      const r = resizedImage[i];
      const g = resizedImage[i + 1];
      const b = resizedImage[i + 2];
      pixels.push([r, g, b]);
    }

    if (pixels.length === 0) {
      throw new Error('No valid pixel data extracted');
    }

    const result = kmeans(pixels, numColors);
    return result.centroids;
  } catch (error) {
    console.error('Error extracting dominant colors:', error.message);
    throw new Error('Failed to extract dominant colors');
  }
};

// Vectorize image using vtracer or potrace as fallback
const vectorizeImage = async (imgBuffer) => {
  try {
    if (!vtracer) {
      throw new Error('vtracer is not defined');
    }

    const svg = await vtracer({
      input: imgBuffer,
      colorPrecision: 12,
      layerDifference: 12,
      mode: 'spline',
    });

    const pngBuffer = await sharp(Buffer.from(svg))
      .toFormat('png')
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    return pngBuffer;
  } catch (vtracerError) {
    console.warn('vtracer failed:', vtracerError.message);
    console.log('Falling back to potrace...');

    return new Promise((resolve, reject) => {
      potrace.trace(imgBuffer, { color: 'black', threshold: 128 }, async (err, svg) => {
        if (err) {
          console.error('Potrace vectorization failed:', err.message);
          reject(new Error('Vectorization failed using both vtracer and potrace'));
        } else {
          try {
            const pngBuffer = await sharp(Buffer.from(svg))
              .toFormat('png')
              .flatten({ background: { r: 255, g: 255, b: 255 } })
              .toBuffer();

            resolve(pngBuffer);
          } catch (svgError) {
            reject(new Error('Failed to convert SVG to PNG'));
          }
        }
      });
    });
  }
};

// Image segmentation endpoint
app.post('/segmentImage', async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { image } = req.files;
    const imgBuffer = image.data;

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg'];
    if (!validMimeTypes.includes(image.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only image files are allowed' });
    }

    const { colorOption = '12' } = req.body;
    if (!['vector', '12', '24', 'none'].includes(colorOption)) {
      return res.status(400).json({ error: 'Invalid color option. Allowed values are "vector", "12", "24", "none".' });
    }

    const pngBuffer = await sharp(imgBuffer).toFormat('png').toBuffer();

    let processedImage;
    if (colorOption === 'vector') {
      const svg = await vectorizeImage(pngBuffer);
      processedImage = Buffer.from(svg);
    } else if (colorOption === 'none') {
      processedImage = pngBuffer;
    } else {
      const numColors = parseInt(colorOption, 10);

      if (numColors === 12 || numColors === 24) {
        const dominantColors = await extractDominantColors(pngBuffer, numColors);
        const rawImage = await sharp(pngBuffer).raw().toBuffer();
        const segmentedPixels = [];

        for (let i = 0; i < rawImage.length; i += 3) {
          const [r, g, b] = [rawImage[i], rawImage[i + 1], rawImage[i + 2]];

          const closestColor = dominantColors.reduce((prev, curr) => {
            const prevDist = Math.sqrt(Math.pow(prev[0] - r, 2) + Math.pow(prev[1] - g, 2) + Math.pow(prev[2] - b, 2));
            const currDist = Math.sqrt(Math.pow(curr[0] - r, 2) + Math.pow(curr[1] - g, 2) + Math.pow(curr[2] - b, 2));
            return prevDist < currDist ? prev : curr;
          });

          segmentedPixels.push(...closestColor.map(Math.round));
        }

        const { width, height } = await sharp(pngBuffer).metadata();

        processedImage = await sharp(Buffer.from(segmentedPixels), { raw: { width, height, channels: 3 } })
          .toFormat('png')
          .toBuffer();
      }
    }

    res.status(200).json({ image: processedImage.toString('base64') });
  } catch (error) {
    console.error('Error segmenting image:', error.message);
    res.status(500).json({ error: 'Failed to segment image', message: error.message });
  }
});

// Generate image endpoint (DALL-E)
app.post('/generateImage', async (req, res) => {
  const { prompt, height, width } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: "Invalid or missing 'prompt' in request body" });
  }

  if (!height || isNaN(height) || height <= 0) {
    return res.status(400).json({ error: "Invalid 'height' in request body" });
  }

  if (!width || isNaN(width) || width <= 0) {
    return res.status(400).json({ error: "Invalid 'width' in request body" });
  }

  try {
    const image = await openai.images.generate({
      prompt,
      model: 'dall-e-3',
      n: 1,
      size: `${width}x${height}`,
      response_format: 'b64_json',
    });

    res.status(200).json({ image: image.data[0].b64_json });
  } catch (error) {
    console.error('Error generating image:', error.message);
    res.status(500).json({ error: 'Failed to generate image', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Internal server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});