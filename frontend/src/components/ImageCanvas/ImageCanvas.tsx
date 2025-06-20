import React, { useRef, useEffect, forwardRef, useState } from "react";
import { fabric } from "fabric";
import "./ImageCanvas.css";
import { useTranslation } from "react-i18next";

interface ImageCanvasProps {
  uploadedImage: string;
  onSegmentsUpdated?: (segmentedImageUrl: string) => void;
  onDeleteImage: () => void;
  showGrid?: boolean;
  gridSpacing?: number;
  toggleFrameEditability: () => void;
  numberPositions?: Array<{ x: number; y: number; number: number }>;
  onNumbersGenerated?: (
    positions: Array<{ x: number; y: number; number: number }>
  ) => void;
}

const ImageCanvas = forwardRef<HTMLCanvasElement | null, ImageCanvasProps>(
  (
    {
      uploadedImage,
      onSegmentsUpdated,
      onDeleteImage,
      showGrid = false,
      gridSpacing = 50,
      toggleFrameEditability,
      numberPositions = [],
      onNumbersGenerated,
    },
    ref
  ) => {
    const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const mainImageRef = useRef<fabric.Image | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(showGrid);
    const [isFrameEditable, setIsFrameEditable] = useState(false);
    const [colorRegions, setColorRegions] = useState<
      Array<{ color: string; points: Array<{ x: number; y: number }> }>
    >([]);
    const { t } = useTranslation();

    useEffect(() => {
      if (!fabricCanvasRef.current) return;

      fabricCanvas.current = new fabric.Canvas(fabricCanvasRef.current, {
        width: 900,
        height: 750,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
      });

      return () => {
        fabricCanvas.current?.dispose();
      };
    }, []);

    const drawGrid = () => {
      if (!fabricCanvas.current) return;

      const width = fabricCanvas.current.width!;
      const height = fabricCanvas.current.height!;

      clearGrid();

      for (let y = 0; y < height; y += gridSpacing) {
        const line = new fabric.Line([0, y, width, y], {
          stroke: "rgba(235, 235, 235, 0.5)",
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      for (let x = 0; x < width; x += gridSpacing) {
        const line = new fabric.Line([x, 0, x, height], {
          stroke: "rgba(235, 235, 235, 0.5)",
          strokeWidth: 1,
          selectable: false,
        });
        fabricCanvas.current.add(line);
      }

      fabricCanvas.current.renderAll();
    };

    const clearGrid = () => {
      if (!fabricCanvas.current) return;
      fabricCanvas.current
        .getObjects("line")
        .forEach((line) => fabricCanvas.current?.remove(line));
      fabricCanvas.current.renderAll();
    };

    const toggleGrid = () => {
      setIsGridVisible((prev) => !prev);
      if (!isGridVisible) {
        drawGrid();
      } else {
        clearGrid();
      }
    };

    const handleFrameEditability = () => {
      const newState = !isFrameEditable;
      setIsFrameEditable(newState);

      if (mainImageRef.current) {
        mainImageRef.current.set({
          selectable: newState,
          hasControls: newState,
          hasBorders: newState,
          lockMovementX: !newState,
          lockMovementY: !newState,
          lockScalingX: !newState,
          lockScalingY: !newState,
          lockRotation: !newState,
        });
        fabricCanvas.current?.renderAll();
      }

      toggleFrameEditability();
    };

    const enhancedCannyEdgeDetection = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const edgeData = new Uint8ClampedArray(data.length);
      const sobelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ];
      const sobelY = [
        [1, 2, 1],
        [0, 0, 0],
        [-1, -2, -1],
      ];

      const gradients = new Array(width * height).fill(0);
      let maxGradient = 0;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0,
            gy = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const i = ((y + ky) * width + (x + kx)) * 4;
              const grayValue = data[i];

              gx += grayValue * sobelX[ky + 1][kx + 1];
              gy += grayValue * sobelY[ky + 1][kx + 1];
            }
          }

          const magnitude = Math.sqrt(gx * gx + gy * gy);
          gradients[y * width + x] = magnitude;
          if (magnitude > maxGradient) maxGradient = magnitude;
        }
      }

      const threshold = maxGradient * 0.15;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          edgeData[i] =
            edgeData[i + 1] =
            edgeData[i + 2] =
              gradients[y * width + x] > threshold ? 0 : 255;
          edgeData[i + 3] = 255;
        }
      }

      return edgeData;
    };

    const cleanUpEdges = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const cleanedData = new Uint8ClampedArray(data);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) {
            let edgeNeighbors = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                if (ky === 0 && kx === 0) continue;
                const ni = ((y + ky) * width + (x + kx)) * 4;
                if (data[ni] === 0) edgeNeighbors++;
              }
            }
            if (edgeNeighbors < 2) {
              cleanedData[i] = cleanedData[i + 1] = cleanedData[i + 2] = 255;
            }
          }
        }
      }

      return cleanedData;
    };

    const outlineImage = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;

      const originalImage = mainImageRef.current;
      const numbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const backgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "rect");
      const gridLines = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "line");

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      const originalSize = originalImage.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      tempCtx.drawImage(originalImage.getElement(), 0, 0);

      const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );
      const data = imageData.data;

      // Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      const edgeData = enhancedCannyEdgeDetection(
        data,
        tempCanvas.width,
        tempCanvas.height
      );
      const processedEdgeData = cleanUpEdges(
        edgeData,
        tempCanvas.width,
        tempCanvas.height
      );

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = originalSize.width;
      finalCanvas.height = originalSize.height;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) return;

      finalCtx.fillStyle = "rgba(0, 0, 0, 0)";
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      const finalImageData = finalCtx.createImageData(
        finalCanvas.width,
        finalCanvas.height
      );
      for (let i = 0; i < processedEdgeData.length; i += 4) {
        if (processedEdgeData[i] === 0) {
          finalImageData.data[i] = 0;
          finalImageData.data[i + 1] = 0;
          finalImageData.data[i + 2] = 0;
          finalImageData.data[i + 3] = 255;
        } else {
          finalImageData.data[i + 3] = 0;
        }
      }
      finalCtx.putImageData(finalImageData, 0, 0);

      const outlinedImage = new fabric.Image(finalCanvas, {
        left: originalImage.left,
        top: originalImage.top,
        scaleX: originalImage.scaleX,
        scaleY: originalImage.scaleY,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        opacity: 1.0,
      });

      fabricCanvas.current.clear();
      fabricCanvas.current.add(originalImage);
      fabricCanvas.current.add(outlinedImage);

      backgrounds.forEach((bg) => fabricCanvas.current?.add(bg));
      numbers.forEach((num) => fabricCanvas.current?.add(num));

      if (isGridVisible) {
        gridLines.forEach((line) => fabricCanvas.current?.add(line));
      }

      numbers.forEach((num) => num.bringToFront());
      fabricCanvas.current.renderAll();

      if (onSegmentsUpdated) {
        onSegmentsUpdated(finalCanvas.toDataURL("image/png"));
      }

      analyzeColorRegions(originalImage);
    };

    const getOutlinedImageData = (img: fabric.Image): ImageData => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return new ImageData(1, 1);

      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      const imgElement = img.getElement();
      tempCtx.drawImage(
        imgElement,
        0,
        0,
        originalSize.width,
        originalSize.height
      );

      const imageData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      );
      const edgeData = enhancedCannyEdgeDetection(
        imageData.data,
        originalSize.width,
        originalSize.height
      );

      return new ImageData(edgeData, originalSize.width, originalSize.height);
    };

    const getDominantColor = (
      data: Uint8ClampedArray,
      width: number,
      x: number,
      y: number,
      radius: number
    ) => {
      const colorCount: Record<string, number> = {};
      let maxCount = 0;
      let dominantColor = { r: 0, g: 0, b: 0 };

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (
            nx < 0 ||
            nx >= width ||
            ny < 0 ||
            ny >= Math.floor(data.length / (width * 4))
          ) {
            continue;
          }

          const i = (ny * width + nx) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r === 0 && g === 0 && b === 0) continue;

          const colorKey = `${r},${g},${b}`;
          colorCount[colorKey] = (colorCount[colorKey] || 0) + 1;

          if (colorCount[colorKey] > maxCount) {
            maxCount = colorCount[colorKey];
            dominantColor = { r, g, b };
          }
        }
      }

      return dominantColor;
    };

    const findEnclosedRegions = (
      data: Uint8ClampedArray,
      width: number,
      height: number
    ) => {
      const visited = new Array(width * height).fill(false);
      const regions: Array<{
        color: string;
        points: Array<{ x: number; y: number }>;
        bounds: { minX: number; minY: number; maxX: number; maxY: number };
      }> = [];

      const edgePixels = new Set<number>();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (data[i] === 0) {
            edgePixels.add(y * width + x);
          }
        }
      }

      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const index = y * width + x;
          if (!visited[index] && !edgePixels.has(index)) {

            const color = getDominantColor(data, width, x, y, 3);

            if (color.r > 240 && color.g > 240 && color.b > 240) continue;

            const regionPoints: Array<{ x: number; y: number }> = [];
            let minX = width,
              maxX = 0,
              minY = height,
              maxY = 0;
            const queue = [{ x, y }];
            visited[index] = true;

            while (queue.length > 0) {
              const point = queue.shift()!;
              const px = point.x;
              const py = point.y;

              minX = Math.min(minX, px);
              maxX = Math.max(maxX, px);
              minY = Math.min(minY, py);
              maxY = Math.max(maxY, py);

              regionPoints.push({ x: px, y: py });

              const neighbors = [
                { x: px + 1, y: py },
                { x: px - 1, y: py },
                { x: px, y: py + 1 },
                { x: px, y: py - 1 },
              ];

              for (const neighbor of neighbors) {
                const nx = neighbor.x;
                const ny = neighbor.y;

                if (nx <= 0 || nx >= width - 1 || ny <= 0 || ny >= height - 1) {
                  continue;
                }

                const nIndex = ny * width + nx;

                if (!edgePixels.has(nIndex) && !visited[nIndex]) {
                  visited[nIndex] = true;
                  queue.push(neighbor);
                }
              }
            }

            if (regionPoints.length > 100) {
              const regionWidth = maxX - minX;
              const regionHeight = maxY - minY;
              const aspectRatio = regionWidth / regionHeight;

              if (aspectRatio > 0.2 && aspectRatio < 5) {
                regions.push({
                  color: `rgb(${color.r},${color.g},${color.b})`,
                  points: regionPoints,
                  bounds: { minX, minY, maxX, maxY },
                });
              }
            }
          }
        }
      }

      return regions;
    };

    const analyzeColorRegions = (img: fabric.Image) => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx || !fabricCanvas.current) return;

      const originalSize = img.getOriginalSize();
      tempCanvas.width = originalSize.width;
      tempCanvas.height = originalSize.height;

      const imgElement = img.getElement();
      tempCtx.drawImage(
        imgElement,
        0,
        0,
        originalSize.width,
        originalSize.height
      );
      const originalImageData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      );

      const outlined = getOutlinedImageData(img);
      tempCtx.putImageData(outlined, 0, 0);
      const edgeData = tempCtx.getImageData(
        0,
        0,
        originalSize.width,
        originalSize.height
      ).data;

      const combinedData = new Uint8ClampedArray(originalImageData.data);
      for (let i = 0; i < edgeData.length; i += 4) {
        if (edgeData[i] === 0) {
          // Edge pixel
          combinedData[i] = combinedData[i + 1] = combinedData[i + 2] = 0;
        }
      }

      const regions = findEnclosedRegions(
        combinedData,
        originalSize.width,
        originalSize.height
      );

      setColorRegions(regions);
      generateNumbersForRegions(regions);
    };

    const generateNumbersForRegions = (
      regions: Array<{
        color: string;
        points: Array<{ x: number; y: number }>;
        bounds: { minX: number; minY: number; maxX: number; maxY: number };
      }>
    ) => {
      if (!mainImageRef.current || !fabricCanvas.current) return;

      const img = mainImageRef.current;
      const originalSize = img.getOriginalSize();
      const positions: Array<{ x: number; y: number; number: number }> = [];

      const sortedRegions = [...regions].sort(
        (a, b) => b.points.length - a.points.length
      );

      sortedRegions.forEach((region, index) => {
        if (region.points.length < 150) return;

        let sumX = 0,
          sumY = 0;
        region.points.forEach((point) => {
          sumX += point.x;
          sumY += point.y;
        });
        const centroidX = sumX / region.points.length;
        const centroidY = sumY / region.points.length;

        let bestPoint = region.points[0];
        let maxDistance = 0;

        for (const point of region.points) {
          const distToLeft = point.x - region.bounds.minX;
          const distToRight = region.bounds.maxX - point.x;
          const distToTop = point.y - region.bounds.minY;
          const distToBottom = region.bounds.maxY - point.y;

          const minDistToBoundary = Math.min(
            distToLeft,
            distToRight,
            distToTop,
            distToBottom
          );

          const distToCentroid = Math.sqrt(
            Math.pow(point.x - centroidX, 2) + Math.pow(point.y - centroidY, 2)
          );

          const score = minDistToBoundary - distToCentroid * 0.2;

          if (score > maxDistance) {
            maxDistance = score;
            bestPoint = point;
          }
        }

        positions.push({
          x: bestPoint.x,
          y: bestPoint.y,
          number: index + 1,
        });
      });

      if (onNumbersGenerated) {
        onNumbersGenerated(positions);
      }

      addNumbersToCanvas();
    };

    const addNumbersToCanvas = () => {
      if (!fabricCanvas.current || !mainImageRef.current) return;

      const existingNumbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const existingBackgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "circle" && obj.name === "number-bg");
      existingNumbers.forEach((num) => fabricCanvas.current?.remove(num));
      existingBackgrounds.forEach((bg) => fabricCanvas.current?.remove(bg));

      const img = mainImageRef.current;
      const imgLeft = img.left || 0;
      const imgTop = img.top || 0;
      const imgScaleX = img.scaleX || 1;
      const imgScaleY = img.scaleY || 1;
      const originalWidth = img.getOriginalSize().width;
      const originalHeight = img.getOriginalSize().height;

      numberPositions.forEach((pos) => {

        const x = imgLeft + (pos.x / originalWidth) * (img.width || 0) * imgScaleX;
        const y = imgTop + (pos.y / originalHeight) * (img.height || 0) * imgScaleY;

        const bgCircle = new fabric.Circle({
          radius: 15,
          fill: 'rgba(0,0,0,0)', 
          stroke: 'rgba(0,0,0,0)',
          originX: 'center',
          originY: 'center',
          selectable: true,
          hasControls: false,
          hasBorders: false,
          name: 'number-bg',
          hoverCursor: 'move',
          perPixelTargetFind: true
        });

        const text = new fabric.Text(pos.number.toString(), {
          fontSize: 12,
          fill: "black",
          fontFamily: "Arial",
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: false,
          hasBorders: true,
          name: "number-text",
          data: { number: pos.number },
        });

        const group = new fabric.Group([bgCircle, text], {
          left: x,
          top: y,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          name: "number-group",
          data: { number: pos.number },
        });

        group.on("modified", () => {
          if (onNumbersGenerated) {

            const updatedPositions = numberPositions.map((p) => {
              if (p.number === pos.number) {

                const originalX =
                  (((group.left! - imgLeft) / imgScaleX) * originalWidth) /
                  (img.width || originalWidth);
                const originalY =
                  (((group.top! - imgTop) / imgScaleY) * originalHeight) /
                  (img.height || originalHeight);
                return { ...p, x: originalX, y: originalY };
              }
              return p;
            });
            onNumbersGenerated(updatedPositions);
          }
        });

        fabricCanvas.current?.add(group);
        group.bringToFront();
      });

      fabricCanvas.current?.renderAll();
    };

    useEffect(() => {
      if (!fabricCanvas.current || !uploadedImage) return;

      const existingNumbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.name === "number-group");

      fabricCanvas.current.clear();

      if (numberPositions.length === 0) {
        existingNumbers.forEach((num) => fabricCanvas.current?.add(num));
      }

      fabric.Image.fromURL(uploadedImage, (img) => {
        mainImageRef.current = img;

        addNumbersToCanvas();

      });
    }, [uploadedImage, isFrameEditable]);

    const addManualNumber = (position: { x: number; y: number }) => {
      if (!fabricCanvas.current || !mainImageRef.current) return;

      const img = mainImageRef.current;
      const nextNumber =
        numberPositions.length > 0
          ? Math.max(...numberPositions.map((p) => p.number)) + 1
          : 1;

      const newPosition = {
        x: position.x,
        y: position.y,
        number: nextNumber,
      };

      if (onNumbersGenerated) {
        onNumbersGenerated([...numberPositions, newPosition]);
      }
    };

    useEffect(() => {
      if (!fabricCanvas.current) return;

      const handleCanvasClick = (e: fabric.IEvent) => {
        if (e.target || !isFrameEditable) return;

        const pointer = fabricCanvas.current?.getPointer(e.e);
        if (pointer) {
          addManualNumber({ x: pointer.x, y: pointer.y });
        }
      };

      fabricCanvas.current.on("mouse:down", handleCanvasClick);

      return () => {
        fabricCanvas.current?.off("mouse:down", handleCanvasClick);
      };
    }, [isFrameEditable, numberPositions]);

    const visualizeRegions = (regions: typeof colorRegions) => {
      if (!fabricCanvas.current) return;

      fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.name === "region-debug")
        .forEach((obj) => fabricCanvas.current?.remove(obj));

      regions.forEach((region) => {
        const points = region.points
          .filter((_, i) => i % 10 === 0)
          .map((p) => ({ x: p.x, y: p.y }));

        if (points.length > 2) {
          const poly = new fabric.Polygon(points, {
            fill: region.color + "80",
            stroke: "red",
            strokeWidth: 1,
            selectable: false,
            evented: false,
            name: "region-debug",
            opacity: 0.5,
          });
          fabricCanvas.current?.add(poly);
          poly.sendToBack();
        }
      });
    };

    useEffect(() => {
      if (!fabricCanvas.current || !uploadedImage) return;

      const existingNumbers = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "text");
      const existingBackgrounds = fabricCanvas.current
        .getObjects()
        .filter((obj) => obj.type === "rect");
      fabricCanvas.current.clear();
      existingNumbers.forEach((num) => fabricCanvas.current?.add(num));
      existingBackgrounds.forEach((bg) => fabricCanvas.current?.add(bg));

      fabric.Image.fromURL(uploadedImage, (img) => {
        mainImageRef.current = img;
        const originalSize = img.getOriginalSize();
        const aspectRatio = originalSize.width / originalSize.height;
        let newWidth, newHeight;

        if (originalSize.width > originalSize.height) {
          newWidth = 700;
          newHeight = 700 / aspectRatio;
        } else {
          newHeight = 700;
          newWidth = 700 * aspectRatio;
        }

        img.set({
          scaleX: newWidth / originalSize.width,
          scaleY: newHeight / originalSize.height,
          left: (900 - newWidth) / 2,
          top: (750 - newHeight) / 2,
          selectable: isFrameEditable,
          hasControls: isFrameEditable,
          hasBorders: isFrameEditable,
          lockMovementX: !isFrameEditable,
          lockMovementY: !isFrameEditable,
          lockScalingX: !isFrameEditable,
          lockScalingY: !isFrameEditable,
          lockRotation: !isFrameEditable,
        });

        fabricCanvas.current?.add(img);
        addNumbersToCanvas();

        if (isGridVisible) {
          drawGrid();
        }

        fabricCanvas.current?.renderAll();
        analyzeColorRegions(img);
      });
    }, [uploadedImage, isFrameEditable]);

    return (
      <div className="image-canvas-container">
        {uploadedImage && (
          <div className="image-close-button" onClick={onDeleteImage}>
            &times;
          </div>
        )}
        <canvas ref={fabricCanvasRef} />
        <div className="canvas-controls">
          <button className="segment-button" onClick={outlineImage}>
            {t("canvas.outline")}
          </button>
          <button className="toggle-grid-button" onClick={toggleGrid}>
            {isGridVisible ? t("canvas.hide") : t("canvas.show")}
          </button>

          <button
            className="toggle-frame-button"
            onClick={handleFrameEditability}
          >
            {isFrameEditable ? t("canvas.lock") : t("canvas.edit")}
          </button>
        </div>
      </div>
    );
  }
);

export default ImageCanvas;
