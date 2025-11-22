import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceInputButton, RecordingIndicator } from '../VoiceInputButton';

describe('VoiceInputButton', () => {
  const defaultProps = {
    isListening: false,
    isVoiceActive: false,
    isSupported: true,
    onStartListening: vi.fn(),
    onStopListening: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render microphone icon when not listening', () => {
      render(<VoiceInputButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Start voice input');
    });

    it('should render stop icon when listening', () => {
      render(<VoiceInputButton {...defaultProps} isListening={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Stop voice input');
    });

    it('should show not supported message when unsupported', () => {
      render(<VoiceInputButton {...defaultProps} isSupported={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Voice input not supported');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<VoiceInputButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Interaction', () => {
    it('should call onStartListening when clicked and not listening', () => {
      const onStartListening = vi.fn();
      render(
        <VoiceInputButton 
          {...defaultProps} 
          onStartListening={onStartListening}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onStartListening).toHaveBeenCalledTimes(1);
    });

    it('should call onStopListening when clicked and listening', () => {
      const onStopListening = vi.fn();
      render(
        <VoiceInputButton 
          {...defaultProps} 
          isListening={true}
          onStopListening={onStopListening}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onStopListening).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers when disabled', () => {
      const onStartListening = vi.fn();
      render(
        <VoiceInputButton 
          {...defaultProps} 
          disabled={true}
          onStartListening={onStartListening}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onStartListening).not.toHaveBeenCalled();
    });

    it('should not call handlers when not supported', () => {
      const onStartListening = vi.fn();
      render(
        <VoiceInputButton 
          {...defaultProps} 
          isSupported={false}
          onStartListening={onStartListening}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(onStartListening).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should apply correct size classes', () => {
      const { rerender } = render(<VoiceInputButton {...defaultProps} size="sm" />);
      expect(screen.getByRole('button')).toHaveClass('w-10', 'h-10');
      
      rerender(<VoiceInputButton {...defaultProps} size="md" />);
      expect(screen.getByRole('button')).toHaveClass('w-14', 'h-14');
      
      rerender(<VoiceInputButton {...defaultProps} size="lg" />);
      expect(screen.getByRole('button')).toHaveClass('w-20', 'h-20');
    });

    it('should apply correct variant classes', () => {
      const { rerender } = render(<VoiceInputButton {...defaultProps} variant="primary" />);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-blue');
      
      rerender(<VoiceInputButton {...defaultProps} variant="secondary" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      
      rerender(<VoiceInputButton {...defaultProps} variant="ghost" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });

    it('should apply listening state classes', () => {
      render(<VoiceInputButton {...defaultProps} isListening={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('animate-pulse');
    });

    it('should apply custom className', () => {
      render(<VoiceInputButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<VoiceInputButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('should be focusable', () => {
      render(<VoiceInputButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Animation Effects', () => {
    it('should show voice activity indicators when listening', () => {
      render(
        <VoiceInputButton 
          {...defaultProps} 
          isListening={true} 
          isVoiceActive={true} 
        />
      );
      
      // Should have animated rings
      const rings = document.querySelectorAll('.animate-ping');
      expect(rings.length).toBeGreaterThan(0);
    });
  });
});

describe('RecordingIndicator', () => {
  it('should not render when not listening', () => {
    const { container } = render(
      <RecordingIndicator isListening={false} isVoiceActive={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when listening', () => {
    render(<RecordingIndicator isListening={true} isVoiceActive={false} />);
    
    expect(screen.getByText('Speak now')).toBeInTheDocument();
  });

  it('should show listening state when voice is active', () => {
    render(<RecordingIndicator isListening={true} isVoiceActive={true} />);
    
    expect(screen.getByText('Listening...')).toBeInTheDocument();
  });

  it('should show audio level bars', () => {
    render(<RecordingIndicator isListening={true} isVoiceActive={true} />);
    
    // Should have 4 audio level bars
    const bars = document.querySelectorAll('.w-1.bg-primary-blue');
    expect(bars).toHaveLength(4);
  });

  it('should apply custom className', () => {
    render(
      <RecordingIndicator 
        isListening={true} 
        isVoiceActive={false} 
        className="custom-indicator" 
      />
    );
    
    const indicator = document.querySelector('.custom-indicator');
    expect(indicator).toBeInTheDocument();
  });
});