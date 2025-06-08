import React, { useState } from 'react';
import './ImageGenerate.css';
import { assets } from '../../assets/assets';
import { useTranslation } from "react-i18next";

const ImageGenerate: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImage, setGeneratedImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSegmentLoading, setIsSegmentLoading] = useState<boolean>(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string>('1024x1024');
    const [selectedColorOption, setSelectedColorOption] = useState<string>('none');
    const { t } = useTranslation();

    const handleGenerateImage = async () => {
        if (!prompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }
        setIsLoading(true);
        try {
            const [height, width] = selectedSize.split('x').map(Number);
            const response = await fetch("http://localhost:4000/generateImage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt, height, width }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || "Failed to generate image"}`);
                return;
            }
            const { image } = await response.json();
            if (!image) {
                alert("Image data is missing from the response.");
                return;
            }
            setUploadedImage(null);
            setGeneratedImage(`data:image/png;base64,${image}`);
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Error generating image. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteImage = () => {
        setUploadedImage(null);
        setGeneratedImage('');
    };

    const handleSegmentImage = async () => {
        console.log("Uploaded Image:", uploadedImage);
        console.log("Generated Image:", generatedImage);
        console.log("Selected Color Option:", selectedColorOption);
        const imageToSegment = uploadedImage || generatedImage;
        if (!imageToSegment) {
            alert("Please upload or generate an image first.");
            return;
        }

        if (selectedColorOption === "none") {
            alert("Please select a valid color option.");
            return;
        }

        setIsSegmentLoading(true);
        try {
            const file = dataURLtoFile(imageToSegment, "image.png");
            const formData = new FormData();
            formData.append("image", file);
            formData.append("colorOption", selectedColorOption);

            const response = await fetch("http://localhost:4000/segmentImage", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || "Failed to segment image"}`);
                return;
            }

            const { image, error } = await response.json();
            if (error) {
                alert(`Error: ${error}`);
                return;
            }

            if (!image) {
                alert("Segmented image data is missing from the response.");
                return;
            }

            setGeneratedImage(`data:image/png;base64,${image}`);
        } catch (error) {
            console.error("Error segmenting image:", error);
            alert("Error segmenting image. Please try again later.");
        } finally {
            setIsSegmentLoading(false);
        }
    };

    const dataURLtoFile = (dataUrl: string, filename: string): File => {
        const [header, content] = dataUrl.split(',');
        const match = header.match(/:(.*?);/);
        const mime = match ? match[1] : '';

        if (mime === "image/svg+xml") {
            const blob = new Blob([decodeURIComponent(atob(content))], { type: mime });
            return new File([blob], filename, { type: mime });
        } else {
            const bstr = atob(content);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
        }
    };

    const isSVG = (image: string) => {
        return image && image.startsWith("data:image/svg+xml");
    };

    return (
        <div className="image-generator-container">
            {/* <h1><span className="art-text">Create</span> Your Art, <span className="art-text">One Number</span> at a Time!</h1> */}
            <div className="content">
                <div className='generate-box'>
                    <textarea
                        className="prompt-input"
                        placeholder={t("generate.ph")}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={2}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerateImage();
                            }
                        }}
                    />

                    <select
                        className="dimension-input"
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                    >
                        <option value="1024x1024">1024x1024</option>
                        <option value="1024x1792">1024x1792</option>
                        <option value="1792x1024">1792x1024</option>
                    </select>

                    <button
                        className="generate-btn"
                        onClick={handleGenerateImage}
                        disabled={isLoading}
                    >
                        {isLoading ? t("generate.loading") : t("generate.generate")}
                    </button>

                </div>
                <div className="btn-container">
                    <select
                        className="color-option-input"
                        value={selectedColorOption}
                        onChange={(e) => setSelectedColorOption(e.target.value)}
                    >
                        <option value="none">{t("generate.choose")}</option>
                        <option value="vector">{t("generate.vector")}</option>
                        <option value="12">{t("generate.12")}</option>
                        <option value="24">{t("generate.24")}</option>
                    </select>
                    <button
                        className="segment-btn"
                        onClick={handleSegmentImage}
                        disabled={isSegmentLoading || (!uploadedImage && !generatedImage)}
                    >
                        {isSegmentLoading ? t("generate.loading2") : t("generate.segment")}
                    </button>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    style={{ display: 'none' }}
                    id="upload-image-input"
                />
                
                <div className="image-container">
                    {uploadedImage ? (
                        <img
                            src={uploadedImage}
                            className="uploaded-image"
                            alt="Uploaded"
                        />
                    ) : (
                        <img
                            src={isSVG(generatedImage) ? generatedImage : (generatedImage || assets.image_placeholder)}
                            className="generated-image"
                            alt="Placeholder"
                        />
                    )}
                </div>


                <div className="button-container">
                    <button
                        className="upload-btn"
                        onClick={() => document.getElementById('upload-image-input')?.click()}
                    >
                        <svg
                            aria-hidden="true"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeWidth="2"
                                stroke="#fffffff"
                                d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            ></path>
                            <path
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeWidth="2"
                                stroke="#fffffff"
                                d="M17 15V18M17 21V18M17 18H14M17 18H20"
                            ></path>
                        </svg>
                    </button>

                    {generatedImage && (
                        <a
                            href={generatedImage}
                            download="generated-image.png"
                            className="download-btn"
                        >
                            <span className="icon">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>
                            </span>
                        </a>
                    )}

                    <button className="delete-btn" onClick={handleDeleteImage} disabled={!uploadedImage && !generatedImage}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 69 14"
                            className="svgIcon bin-top"
                        >
                            <g clipPath="url(#clip0_35_24)">
                                <path
                                    fill="black"
                                    d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
                                ></path>
                            </g>
                            <defs>
                                <clipPath id="clip0_35_24">
                                    <rect fill="white" height="14" width="69"></rect>
                                </clipPath>
                            </defs>
                        </svg>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 69 57"
                            className="svgIcon bin-bottom"
                        >
                            <g clipPath="url(#clip0_35_22)">
                                <path
                                    fill="black"
                                    d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                                ></path>
                            </g>
                            <defs>
                                <clipPath id="clip0_35_22">
                                    <rect fill="white" height="57" width="69"></rect>
                                </clipPath>
                            </defs>
                        </svg>
                    </button>
                </div>
            </div>
            {/* <p>If you uploaded your own image, please download it after segmentation to view the result.</p> */}
            <p>
                <li>{t("generate.li1")}</li>
                <li>{t("generate.li2")}</li>
                <li>{t("generate.li3")}</li>
            </p>

        
        </div>
    );
};

export default ImageGenerate;
