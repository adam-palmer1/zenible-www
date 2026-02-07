import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperModalProps {
  imageUrl: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
  darkMode?: boolean;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
}

export default function ImageCropperModal({
  imageUrl,
  onComplete,
  onCancel,
  darkMode = false,
  aspectRatio = 1, // 1:1 for square/circle
  cropShape = 'round' // 'rect' or 'round'
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCenter = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApply = async () => {
    try {
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      );
      onComplete(croppedImage as Blob);
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Failed to crop image. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-3xl rounded-xl overflow-hidden ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Crop & Adjust Image
          </h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Zoom, drag to reposition, and adjust your image
          </p>
        </div>

        {/* Crop Area */}
        <div className={`relative ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-100'}`} style={{ height: '400px' }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            showGrid={false}
            style={{
              containerStyle: {
                backgroundColor: darkMode ? '#1a1a1a' : '#f3f4f6'
              }
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4">
          {/* Zoom Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Zoom
              </label>
              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {zoom.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-zenible-primary"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>1x</span>
              <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>3x</span>
            </div>
          </div>

          {/* Rotation Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Rotation
              </label>
              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {rotation}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-zenible-primary"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>0°</span>
              <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>360°</span>
            </div>
          </div>

          {/* Quick Rotation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text hover:bg-opacity-80'
                  : 'bg-white border-neutral-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ↺ Rotate Left
            </button>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text hover:bg-opacity-80'
                  : 'bg-white border-neutral-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ↻ Rotate Right
            </button>
            <button
              onClick={handleCenter}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text hover:bg-opacity-80'
                  : 'bg-white border-neutral-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⊙ Center & Reset
            </button>
          </div>

          {/* Instructions */}
          <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Drag the image to reposition</li>
              <li>Use the zoom slider to zoom in/out</li>
              <li>Adjust rotation for better framing</li>
              <li>Click "Center & Reset" to start over</li>
            </ul>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            Apply Crop
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to create cropped image
const getCroppedImg = (imageSrc: string, pixelCrop: CroppedAreaPixels | null, rotation = 0): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = pixelCrop!.width;
      canvas.height = pixelCrop!.height;

      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop!.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop!.y)
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'cropped-image.jpg', { type: blob.type });
        resolve(file);
      }, 'image/jpeg', 0.95);
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};
