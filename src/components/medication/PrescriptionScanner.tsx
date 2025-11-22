import React, { useState, useRef, useCallback } from 'react';
import { Button, Card, Spinner } from '@/components/ui';
import { ocrService, ParsedPrescription } from '@/services/ocrService';
import { cn } from '@/utils/cn';

interface PrescriptionScannerProps {
  onScanComplete: (parsedData: ParsedPrescription, originalImage: string) => void;
  onCancel: () => void;
  className?: string;
}

interface ScanState {
  status: 'idle' | 'scanning' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  onScanComplete,
  onCancel,
  className,
}) => {
  const [scanState, setScanState] = useState<ScanState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPrescription | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const updateScanState = useCallback((updates: Partial<ScanState>) => {
    setScanState(prev => ({ ...prev, ...updates }));
  }, []);

  const processImage = async (file: File) => {
    try {
      // Convert file to base64 for display
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      updateScanState({
        status: 'scanning',
        progress: 10,
        message: 'Initializing OCR engine...',
      });

      // Initialize OCR service
      await ocrService.initialize();

      updateScanState({
        progress: 30,
        message: 'Scanning prescription image...',
      });

      // Extract text from image
      const ocrResult = await ocrService.extractTextFromImage(file);

      updateScanState({
        progress: 70,
        message: 'Parsing medication information...',
      });

      // Parse prescription data
      const parsed = ocrService.parsePrescriptionText(ocrResult);
      setParsedData(parsed);

      updateScanState({
        status: 'complete',
        progress: 100,
        message: 'Scan complete!',
      });

    } catch (error) {
      console.error('OCR processing failed:', error);
      updateScanState({
        status: 'error',
        progress: 0,
        message: 'Failed to process image. Please try again with a clearer photo.',
      });
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB');
      return;
    }

    processImage(file);
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

  const handleRetry = () => {
    setScanState({
      status: 'idle',
      progress: 0,
      message: '',
    });
    setCapturedImage(null);
    setParsedData(null);
  };

  const handleUseResults = () => {
    if (parsedData && capturedImage) {
      onScanComplete(parsedData, capturedImage);
    }
  };

  const renderScanningInterface = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-h2 font-bold text-neutral-800 mb-2">
          Scan Prescription Label
        </h2>
        <p className="text-body text-neutral-600">
          Take a photo or upload an image of your prescription label
        </p>
      </div>

      {/* Upload Area */}
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
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-neutral-400">📄</span>
          </div>

          <div>
            <h3 className="text-body font-semibold text-neutral-800 mb-2">
              Upload prescription image
            </h3>
            <p className="text-body text-neutral-600 mb-4">
              Drag and drop an image here, or click to browse
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={openFileDialog}
            >
              Choose from Gallery
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={openCamera}
            >
              Take Photo
            </Button>
          </div>

          <p className="text-caption text-neutral-500">
            Supported formats: JPG, PNG, WebP (max 10MB)
          </p>
        </div>
      </div>

      {/* Scanning Tips */}
      <Card className="p-4 bg-primary-50 border-primary-200">
        <h4 className="text-body font-semibold text-primary-800 mb-3">
          📸 Tips for Best Results
        </h4>
        <ul className="text-caption text-primary-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Ensure the prescription label is clearly visible and well-lit</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Keep the camera steady and avoid blurry photos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Make sure all text on the label is readable</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success-500 mt-0.5">✓</span>
            <span>Avoid shadows or glare on the label</span>
          </li>
        </ul>
      </Card>
    </div>
  );

  const renderProcessingInterface = () => (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-h2 font-bold text-neutral-800 mb-2">
          Processing Prescription
        </h2>
        <p className="text-body text-neutral-600">
          {scanState.message}
        </p>
      </div>

      {capturedImage && (
        <div className="flex justify-center">
          <img
            src={capturedImage}
            alt="Captured prescription"
            className="max-w-xs max-h-48 object-contain rounded-lg border border-neutral-200"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Spinner size="md" />
          <span className="text-body text-neutral-600">
            {scanState.progress}% complete
          </span>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${scanState.progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderResultsInterface = () => {
    if (!parsedData) return null;

    const validation = ocrService.validateParsedData(parsedData);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-h2 font-bold text-neutral-800 mb-2">
            Scan Results
          </h2>
          <p className="text-body text-neutral-600">
            Review the extracted information and make any necessary corrections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Image */}
          {capturedImage && (
            <div>
              <h3 className="text-body font-semibold text-neutral-800 mb-3">
                Original Image
              </h3>
              <img
                src={capturedImage}
                alt="Scanned prescription"
                className="w-full max-h-64 object-contain rounded-lg border border-neutral-200"
              />
            </div>
          )}

          {/* Extracted Data */}
          <div>
            <h3 className="text-body font-semibold text-neutral-800 mb-3">
              Extracted Information
            </h3>
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-caption text-neutral-500 mb-1">Medication Name</p>
                <p className="text-body font-medium text-neutral-800">
                  {parsedData.medicationName || 'Not detected'}
                </p>
              </div>

              <div>
                <p className="text-caption text-neutral-500 mb-1">Dosage</p>
                <p className="text-body font-medium text-neutral-800">
                  {parsedData.dosage || 'Not detected'}
                </p>
              </div>

              <div>
                <p className="text-caption text-neutral-500 mb-1">Form</p>
                <p className="text-body font-medium text-neutral-800">
                  {parsedData.form || 'Not detected'}
                </p>
              </div>

              {parsedData.quantity && (
                <div>
                  <p className="text-caption text-neutral-500 mb-1">Quantity</p>
                  <p className="text-body font-medium text-neutral-800">
                    {parsedData.quantity}
                  </p>
                </div>
              )}

              {parsedData.instructions && (
                <div>
                  <p className="text-caption text-neutral-500 mb-1">Instructions</p>
                  <p className="text-body text-neutral-700">
                    {parsedData.instructions}
                  </p>
                </div>
              )}

              <div>
                <p className="text-caption text-neutral-500 mb-1">Confidence</p>
                <p className="text-body font-medium text-neutral-800">
                  {Math.round(parsedData.confidence)}%
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Validation Issues */}
        {!validation.isValid && (
          <Card className="p-4 bg-warning-50 border-warning-200">
            <h4 className="text-body font-semibold text-warning-800 mb-2">
              ⚠️ Please Review
            </h4>
            <ul className="text-caption text-warning-700 space-y-1">
              {validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
            <p className="text-caption text-warning-700 mt-2">
              You can edit this information in the next step.
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRetry}
            className="flex-1"
          >
            Scan Again
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleUseResults}
            className="flex-1"
          >
            Use This Information
          </Button>
        </div>
      </div>
    );
  };

  const renderErrorInterface = () => (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-h2 font-bold text-neutral-800 mb-2">
          Scan Failed
        </h2>
        <p className="text-body text-neutral-600">
          {scanState.message}
        </p>
      </div>

      {capturedImage && (
        <div className="flex justify-center">
          <img
            src={capturedImage}
            alt="Failed scan"
            className="max-w-xs max-h-48 object-contain rounded-lg border border-neutral-200"
          />
        </div>
      )}

      <Card className="p-4 bg-error-50 border-error-200">
        <h4 className="text-body font-semibold text-error-800 mb-2">
          Troubleshooting Tips
        </h4>
        <ul className="text-caption text-error-700 space-y-1 text-left">
          <li>• Ensure the image is clear and well-lit</li>
          <li>• Make sure all text is readable</li>
          <li>• Try taking the photo from a different angle</li>
          <li>• Remove any shadows or glare from the label</li>
        </ul>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={handleRetry}
          className="flex-1"
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  // Hidden file inputs
  const fileInputs = (
    <>
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
    </>
  );

  return (
    <div className={cn('prescription-scanner max-w-4xl mx-auto', className)}>
      {scanState.status === 'idle' && renderScanningInterface()}
      {(scanState.status === 'scanning' || scanState.status === 'processing') && renderProcessingInterface()}
      {scanState.status === 'complete' && renderResultsInterface()}
      {scanState.status === 'error' && renderErrorInterface()}
      
      {fileInputs}

      {/* Cancel Button (always visible) */}
      {scanState.status !== 'complete' && (
        <div className="mt-8 text-center">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
          >
            Cancel Scanning
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrescriptionScanner;