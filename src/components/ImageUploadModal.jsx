import { useState, useRef } from 'react';
import { apiHelpers } from '../config/api';

export default function ImageUploadModal({ collectionId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Cropping state
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 400,
    height: 400
  });
  
  // Adjustment state
  const [adjustments, setAdjustments] = useState({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    rotation: 0
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or BMP image.');
      return;
    }
    
    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const result = await apiHelpers.uploadCollectionAvatar(
        collectionId, 
        file,
        cropData,
        adjustments
      );
      
      onSuccess(result.image_data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect({ target: { files: [droppedFile] } });
    }
  };

  const getPreviewStyle = () => {
    const style = {
      filter: `brightness(${adjustments.brightness}) contrast(${adjustments.contrast}) saturate(${adjustments.saturation})`,
      transform: `rotate(${adjustments.rotation}deg)`,
    };
    return style;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">Upload Collection Avatar</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 rounded p-3">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {!preview ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-brand-purple transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors"
              >
                Choose File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <h3 className="font-semibold mb-2">Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="relative overflow-hidden" style={{ maxHeight: '400px' }}>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto object-contain"
                      style={getPreviewStyle()}
                    />
                    <div
                      className="absolute border-2 border-brand-purple pointer-events-none"
                      style={{
                        left: `${cropData.x}px`,
                        top: `${cropData.y}px`,
                        width: `${cropData.width}px`,
                        height: `${cropData.height}px`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                      setCropData({ x: 0, y: 0, width: 400, height: 400 });
                      setAdjustments({ brightness: 1.0, contrast: 1.0, saturation: 1.0, rotation: 0 });
                    }}
                    className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
              
              {/* Controls */}
              <div>
                <h3 className="font-semibold mb-2">Adjustments</h3>
                <div className="space-y-4">
                  {/* Crop Controls */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Crop (Square)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">X Position</label>
                        <input
                          type="number"
                          value={cropData.x}
                          onChange={(e) => setCropData({...cropData, x: parseInt(e.target.value) || 0})}
                          min="0"
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Y Position</label>
                        <input
                          type="number"
                          value={cropData.y}
                          onChange={(e) => setCropData({...cropData, y: parseInt(e.target.value) || 0})}
                          min="0"
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Size</label>
                        <input
                          type="number"
                          value={cropData.width}
                          onChange={(e) => {
                            const size = parseInt(e.target.value) || 400;
                            setCropData({...cropData, width: size, height: size});
                          }}
                          min="100"
                          max="1200"
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Adjustments */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Image Adjustments</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Brightness: {adjustments.brightness.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={adjustments.brightness}
                          onChange={(e) => setAdjustments({...adjustments, brightness: parseFloat(e.target.value)})}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Contrast: {adjustments.contrast.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={adjustments.contrast}
                          onChange={(e) => setAdjustments({...adjustments, contrast: parseFloat(e.target.value)})}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Saturation: {adjustments.saturation.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={adjustments.saturation}
                          onChange={(e) => setAdjustments({...adjustments, saturation: parseFloat(e.target.value)})}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Rotation</label>
                        <select
                          value={adjustments.rotation}
                          onChange={(e) => setAdjustments({...adjustments, rotation: parseInt(e.target.value)})}
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option value="0">0°</option>
                          <option value="90">90°</option>
                          <option value="180">180°</option>
                          <option value="270">270°</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setAdjustments({ brightness: 1.0, contrast: 1.0, saturation: 1.0, rotation: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Reset Adjustments
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-hover transition-colors disabled:opacity-50"
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}