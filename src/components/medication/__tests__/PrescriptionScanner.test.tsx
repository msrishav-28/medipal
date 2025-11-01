import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrescriptionScanner from '../PrescriptionScanner';
import { ocrService } from '@/services/ocrService';

// Mock the OCR service
vi.mock('@/services/ocrService', () => ({
  ocrService: {
    initialize: vi.fn(),
    extractTextFromImage: vi.fn(),
    parsePrescriptionText: vi.fn(),
    validateParsedData: vi.fn(),
  },
}));

describe('PrescriptionScanner', () => {
  const mockOnScanComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial scanning interface', () => {
    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Scan Prescription Label')).toBeInTheDocument();
    expect(screen.getByText('Choose from Gallery')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('📸 Tips for Best Results')).toBeInTheDocument();
  });

  it('handles file selection from gallery', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    
    // Mock OCR service responses
    vi.mocked(ocrService.initialize).mockResolvedValue();
    vi.mocked(ocrService.extractTextFromImage).mockResolvedValue({
      text: 'Metformin 500mg tablets',
      confidence: 85,
      words: [],
    });
    vi.mocked(ocrService.parsePrescriptionText).mockReturnValue({
      medicationName: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      confidence: 85,
    });
    vi.mocked(ocrService.validateParsedData).mockReturnValue({
      isValid: true,
      issues: [],
    });

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    // Simulate file selection
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText('Processing Prescription')).toBeInTheDocument();
    });

    // Should eventually show results
    await waitFor(() => {
      expect(screen.getByText('Scan Results')).toBeInTheDocument();
      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText('500mg')).toBeInTheDocument();
    });
  });

  it('handles drag and drop file upload', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const dropZone = screen.getByText(/drag and drop an image here/i).closest('div');

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        files: [mockFile],
      },
    });

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [mockFile],
      },
    });

    // Should start processing
    expect(ocrService.initialize).toHaveBeenCalled();
  });

  it('validates file type and size', () => {
    const mockTextFile = new File(['test'], 'document.txt', { type: 'text/plain' });
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockTextFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    expect(alertSpy).toHaveBeenCalledWith('Please select an image file');
    
    alertSpy.mockRestore();
  });

  it('handles large file size validation', () => {
    // Create a mock file that's too large (>10MB)
    const largeMockFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    });
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [largeMockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    expect(alertSpy).toHaveBeenCalledWith('Image size must be less than 10MB');
    
    alertSpy.mockRestore();
  });

  it('handles OCR processing errors', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    
    // Mock OCR service to fail
    vi.mocked(ocrService.initialize).mockRejectedValue(new Error('OCR failed'));

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Scan Failed')).toBeInTheDocument();
      expect(screen.getByText(/Failed to process image/)).toBeInTheDocument();
    });
  });

  it('shows validation warnings for low confidence scans', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    
    // Mock low confidence OCR result
    vi.mocked(ocrService.initialize).mockResolvedValue();
    vi.mocked(ocrService.extractTextFromImage).mockResolvedValue({
      text: 'unclear text',
      confidence: 45,
      words: [],
    });
    vi.mocked(ocrService.parsePrescriptionText).mockReturnValue({
      medicationName: 'Unknown',
      confidence: 45,
    });
    vi.mocked(ocrService.validateParsedData).mockReturnValue({
      isValid: false,
      issues: ['Low OCR confidence - image may be unclear'],
    });

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Please Review')).toBeInTheDocument();
      expect(screen.getByText(/Low OCR confidence/)).toBeInTheDocument();
    });
  });

  it('allows retrying scan after error', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    
    // Mock OCR service to fail initially
    vi.mocked(ocrService.initialize).mockRejectedValue(new Error('OCR failed'));

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Scan Failed')).toBeInTheDocument();
    });

    // Click retry
    fireEvent.click(screen.getByText('Try Again'));

    // Should return to initial state
    expect(screen.getByText('Scan Prescription Label')).toBeInTheDocument();
  });

  it('calls onScanComplete with parsed data', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    const mockParsedData = {
      medicationName: 'Metformin',
      dosage: '500mg',
      form: 'tablet' as const,
      confidence: 85,
    };
    
    vi.mocked(ocrService.initialize).mockResolvedValue();
    vi.mocked(ocrService.extractTextFromImage).mockResolvedValue({
      text: 'Metformin 500mg tablets',
      confidence: 85,
      words: [],
    });
    vi.mocked(ocrService.parsePrescriptionText).mockReturnValue(mockParsedData);
    vi.mocked(ocrService.validateParsedData).mockReturnValue({
      isValid: true,
      issues: [],
    });

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Wait for results and click use
    await waitFor(() => {
      expect(screen.getByText('Use This Information')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Use This Information'));

    expect(mockOnScanComplete).toHaveBeenCalledWith(
      mockParsedData,
      expect.stringContaining('data:image/jpeg;base64')
    );
  });

  it('calls onCancel when cancel is clicked', () => {
    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel Scanning'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows progress during OCR processing', async () => {
    const mockFile = new File(['test'], 'prescription.jpg', { type: 'image/jpeg' });
    
    // Mock OCR service with delayed responses
    vi.mocked(ocrService.initialize).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    vi.mocked(ocrService.extractTextFromImage).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        text: 'Metformin 500mg',
        confidence: 85,
        words: [],
      }), 100))
    );

    render(
      <PrescriptionScanner
        onScanComplete={mockOnScanComplete}
        onCancel={mockOnCancel}
      />
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    // Should show progress messages
    await waitFor(() => {
      expect(screen.getByText('Initializing OCR engine...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Scanning prescription image...')).toBeInTheDocument();
    });
  });
});