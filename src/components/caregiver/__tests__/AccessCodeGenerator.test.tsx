import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccessCodeGenerator } from '../AccessCodeGenerator';
import { caregiverService } from '@/services/caregiverService';

// Mock the caregiver service
vi.mock('@/services/caregiverService', () => ({
  caregiverService: {
    createAccessCode: vi.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('AccessCodeGenerator', () => {
  const mockPatientId = 'patient-123';
  const mockOnClose = vi.fn();
  const mockOnCodeGenerated = vi.fn();

  const mockAccessCode = {
    id: 'code-123',
    code: 'ABC123',
    patientId: mockPatientId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    isUsed: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render initial state with generate button', () => {
    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    expect(screen.getByText('Generate Caregiver Access Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate access code/i })).toBeInTheDocument();
  });

  it('should generate access code when button is clicked', async () => {
    vi.mocked(caregiverService.createAccessCode).mockResolvedValue(mockAccessCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(caregiverService.createAccessCode).toHaveBeenCalledWith(mockPatientId);
      expect(mockOnCodeGenerated).toHaveBeenCalled();
    });

    // Check if access code is displayed
    expect(screen.getByText(mockAccessCode.code)).toBeInTheDocument();
  });

  it('should display loading state while generating code', async () => {
    vi.mocked(caregiverService.createAccessCode).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAccessCode), 100))
    );

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('should copy code to clipboard', async () => {
    vi.mocked(caregiverService.createAccessCode).mockResolvedValue(mockAccessCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    // Generate code first
    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockAccessCode.code)).toBeInTheDocument();
    });

    // Click copy button
    const copyButtons = screen.getAllByText('Copy');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAccessCode.code);
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should generate registration link', async () => {
    vi.mocked(caregiverService.createAccessCode).mockResolvedValue(mockAccessCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      const linkInput = screen.getByDisplayValue(
        new RegExp(`/caregiver/register\\?code=${mockAccessCode.code}`)
      );
      expect(linkInput).toBeInTheDocument();
    });
  });

  it('should display expiration time', async () => {
    vi.mocked(caregiverService.createAccessCode).mockResolvedValue(mockAccessCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Expires:/)).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', () => {
    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when done button is clicked after generation', async () => {
    vi.mocked(caregiverService.createAccessCode).mockResolvedValue(mockAccessCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    // Generate code
    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockAccessCode.code)).toBeInTheDocument();
    });

    // Click done button
    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should allow generating a new code', async () => {
    const secondMockCode = { ...mockAccessCode, code: 'XYZ789', id: 'code-456' };
    
    vi.mocked(caregiverService.createAccessCode)
      .mockResolvedValueOnce(mockAccessCode)
      .mockResolvedValueOnce(secondMockCode);

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    // Generate first code
    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(mockAccessCode.code)).toBeInTheDocument();
    });

    // Generate new code
    const newCodeButton = screen.getByRole('button', { name: /generate new code/i });
    fireEvent.click(newCodeButton);

    await waitFor(() => {
      expect(screen.getByText(secondMockCode.code)).toBeInTheDocument();
    });

    expect(caregiverService.createAccessCode).toHaveBeenCalledTimes(2);
  });

  it('should handle error when code generation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(caregiverService.createAccessCode).mockRejectedValue(
      new Error('Failed to generate code')
    );

    render(
      <AccessCodeGenerator
        patientId={mockPatientId}
        onClose={mockOnClose}
        onCodeGenerated={mockOnCodeGenerated}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate access code/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
