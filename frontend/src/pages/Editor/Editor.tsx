import React, { useState, useRef, useEffect } from "react";
import Toolbar from "../../components/Toolbar/Toolbar";
import "./Editor.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf";
import ColorsList from "../../components/ColorsList/ColorsList";
import ImageCanvas from "../../components/ImageCanvas/ImageCanvas";
import TextBox from "../../components/TextBox/TextBox";
import { fabric } from 'fabric';
import { useTranslation } from "react-i18next";

interface NumberPosition {
  x: number;
  y: number;
  number: number;
}

interface FabricCanvasRef {
  fabricCanvas: fabric.Canvas | null;
}

const Editor: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 600, height: 600 });
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [colors, setColors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropAreaRef = useRef<HTMLDivElement | null>(null);
  const [isFrameEditable, setIsFrameEditable] = useState(false);
  const [numberPositions, setNumberPositions] = useState<NumberPosition[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("http://localhost:5001/colors");
        const data = await response.json();
        setColors(data);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    fetchColors();

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const dropArea = dropAreaRef.current;
    if (dropArea) {
      dropArea.addEventListener("drop", handleDrop);
      dropArea.addEventListener("dragover", handleDragOver);
    }

    return () => {
      if (dropArea) {
        dropArea.removeEventListener("drop", handleDrop);
        dropArea.removeEventListener("dragover", handleDragOver);
      }
    };
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      pushToHistory(e.target?.result as string, imageSize);
    };
    reader.readAsDataURL(file);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleFrameEditability = () => {
    setIsFrameEditable((prev) => !prev);
  };

  const pushToHistory = (
    image: string | null,
    size: { width: number; height: number }
  ) => {
    setHistory((prevHistory) => {
      const updatedHistory = prevHistory.slice(0, historyIndex + 1);
      updatedHistory.push({ image, size });
      return updatedHistory;
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageSize({ width: 600, height: 600 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    pushToHistory(null, { width: 600, height: 600 });
  };

  const handleExportPDF = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !uploadedImage) return;
  
    const fabricCanvas = (canvas as any).fabricCanvas as fabric.Canvas;
    if (!fabricCanvas) return;
  
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
  
    const objects = fabricCanvas.getObjects();
    if (objects.length === 0) return;
  
    const { left, top, width, height } = calculateContentBounds(objects);
  
    const padding = 20;
    tempCanvas.width = width + padding * 2;
    tempCanvas.height = height + padding * 2;
  
    const exportCanvas = new fabric.StaticCanvas(tempCanvas, {
      width: tempCanvas.width,
      height: tempCanvas.height,
      backgroundColor: '#ffffff'
    });
  
    objects.forEach(obj => {
      const clonedObj = fabric.util.object.clone(obj);
      clonedObj.set({
        left: obj.left! - left + padding,
        top: obj.top! - top + padding
      });
      exportCanvas.add(clonedObj);
    });
  
    exportCanvas.renderAll();
  
    const doc = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "px",
      format: [tempCanvas.width, tempCanvas.height]
    });
  
    doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', 0, 0, tempCanvas.width, tempCanvas.height);
    doc.save("coloring-page.pdf");
  };
  
  const calculateContentBounds = (objects: fabric.Object[]) => {
    const boundingRect = {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity
    };
  
    objects.forEach(obj => {
      const objBounds = obj.getBoundingRect();
      boundingRect.left = Math.min(boundingRect.left, objBounds.left);
      boundingRect.top = Math.min(boundingRect.top, objBounds.top);
      boundingRect.right = Math.max(boundingRect.right, objBounds.left + objBounds.width);
      boundingRect.bottom = Math.max(boundingRect.bottom, objBounds.top + objBounds.height);
    });
  
    return {
      left: boundingRect.left,
      top: boundingRect.top,
      width: boundingRect.right - boundingRect.left,
      height: boundingRect.bottom - boundingRect.top
    };
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevHistory = history[historyIndex - 1];
      setUploadedImage(prevHistory.image);
      setImageSize(prevHistory.size);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextHistory = history[historyIndex + 1];
      setUploadedImage(nextHistory.image);
      setImageSize(nextHistory.size);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handlePlusClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleNumbersDetected = (numbers: NumberPosition[]) => {
    setNumberPositions(numbers);
  };

  return (
    <div className="editor-container">
      <div className="hamburger-menu" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </div>
      <div className={`editor-sidebar ${isSidebarOpen ? "show" : ""}`}>
        <div className="import-text">
          <p>{t("sidebar.import")}</p>
        </div>
        <button
          className="add-file-button"
          onClick={() => fileInputRef.current?.click()}
        >
          {t("sidebar.add")}
        </button>
        <input
          type="file"
          id="file-input"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        <div className="import-text">
          <p>{t("sidebar.export")}</p>
          <button className="export-button" onClick={handleExportPDF}>
            {t("sidebar.pdf")}
          </button>
        </div>
      </div>

      <div className="canvas-container" ref={dropAreaRef}>
        <div className="canvas-area">
          {uploadedImage ? (
            <ImageCanvas
              uploadedImage={uploadedImage}
              ref={fabricCanvasRef}
              onSegmentsUpdated={(segmentedImageUrl) => {
                console.log("Segmented Image Data URL:", segmentedImageUrl);
                setUploadedImage(segmentedImageUrl);
              }}
              onDeleteImage={handleDeleteImage}
              showGrid={false}
              gridSpacing={50}
              toggleFrameEditability={toggleFrameEditability}
              numberPositions={numberPositions}
            />
          ) : (
            <div className="plus-sign">
              <p onClick={handlePlusClick} style={{ cursor: "pointer" }}>
              ☆ {t("editor")} ☆
              </p>
            </div>
          )}
          <ColorsList 
                uploadedImage={uploadedImage}
                onNumbersDetected={handleNumbersDetected}
              />
        </div>
      </div>
      <Toolbar onUndo={handleUndo} onRedo={handleRedo}/>
    </div>
  );
};

export default Editor;
