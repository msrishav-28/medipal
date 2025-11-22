import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { MedicationFormData } from '../AddMedicationWizard';
import { cn } from '@/utils/cn';

interface PillPhotoStepProps {
  formData: MedicationFormData;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<MedicationFormData>) => void;
}

const PillPhotoStep: React.FC<PillPhotoStepProps> = ({
  formData,
  errors,
  onUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onUpdate({ pillImage: result });
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image');
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const removePhoto = () => {
    const { pillImage, ...rest } = formData;
    onUpdate(rest);
  };

  const hasPhoto = !!formData.pillImage;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-h3 font-semibold text-neutral-800 mb-2">
          Add a Photo of Your Pill
        </h3>
        <p className="text-body text-neutral-600">
          Adding a photo helps you identify your medication and makes it easier to confirm you're taking the right pill.
        </p>
      </div>

      {/* Photo Upload Area */}
      {!hasPhoto ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-300 hover:border-neutral-400'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-neutral-400">📷</span>
            </div>

            <div>
              <h4 className="text-body font-semibold text-neutral-800 mb-2">
                Upload or take a photo
              </h4>
              <p className="text-body text-neutral-600 mb-4">
                Drag and drop an image here, or click to browse
              </p>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={openFileDialog}
                disabled={isUploading}
              >
                {isUploading ? 'Processing...' : 'Choose from Gallery'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={openCamera}
                disabled={isUploading}
              >
                Take Photo
              </Button>
            </div>

            <p className="text-caption text-neutral-500">
              Supported formats: JPG, PNG, WebP (max 5MB)
            </p>
          </div>
        </div>
      ) : (
        /* Photo Preview */
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={formData.pillImage}
              alt="Pill photo"
              className="w-48 h-48 object-cover rounded-lg border border-neutral-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-2 -right-2 w-8 h-8 bg-error-500 text-white rounded-full flex items-center justify-center hover:bg-error-600 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openFileDialog}
            >
              Replace Photo
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={openCamera}
            >
              Take New Photo
            </Button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Photo Guidelines */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <h4 className="text-body font-semibold text-neutral-800 mb-3">
          📸 Photo Tips
        </h4>
        <ul className="text-caption text-neutral-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Take the photo in good lighting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Show the pill clearly against a plain background</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Include any text or markings on the pill</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Make sure the image is not blurry</span>
          </li>
        </ul>
      </div>

      {/* Skip Option */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h4 className="text-body font-semibold text-primary-800 mb-2">
          Skip this step?
        </h4>
        <p className="text-caption text-primary-700">
          You can always add a photo later by editing your medication. Photos help with identification but aren't required to set up your medication schedule.
        </p>
      </div>

      {/* Error Display */}
      {errors.pillImage && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-body text-error-700">
            {errors.pillImage}
          </p>
        </div>
      )}
    </div>
  );
};

export default PillPhotoStep;