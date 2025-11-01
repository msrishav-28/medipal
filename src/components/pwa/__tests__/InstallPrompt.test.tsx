import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPrompt } from '../InstallPrompt';

describe('InstallPrompt', () => {
  let deferredPrompt: any;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Create mock beforeinstallprompt event
    deferredPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    };
  });

  it('should not render if already installed', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<InstallPrompt />);

    expect(screen.queryByText(/Install MediCare/i)).not.toBeInTheDocument();
  });

  it('should not render if recently dismissed', () => {
    // Set dismissed timestamp to 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    localStorage.setItem('pwa-prompt-dismissed', oneDayAgo.toISOString());

    render(<InstallPrompt />);

    // Trigger beforeinstallprompt
    window.dispatchEvent(new Event('beforeinstallprompt'));

    expect(screen.queryByText(/Install MediCare/i)).not.toBeInTheDocument();
  });

  it('should render after beforeinstallprompt event and delay', async () => {
    render(<InstallPrompt />);

    // Trigger beforeinstallprompt
    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    // Wait for the 5 second delay
    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  });

  it('should show install prompt with correct text', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    expect(
      screen.getByText(/Install this app on your device for quick access and offline functionality/i)
    ).toBeInTheDocument();
  });

  it('should call prompt when install button clicked', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    const installButton = screen.getByRole('button', { name: /^Install$/i });
    await user.click(installButton);

    expect(deferredPrompt.prompt).toHaveBeenCalled();
  });

  it('should save dismissal timestamp when "Not now" clicked', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    const notNowButton = screen.getByRole('button', { name: /Not now/i });
    await user.click(notNowButton);

    expect(localStorage.getItem('pwa-prompt-dismissed')).toBeTruthy();
  });

  it('should save dismissal timestamp when close button clicked', async () => {
    const user = userEvent.setup();
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    const closeButton = screen.getByRole('button', { name: /Close/i });
    await user.click(closeButton);

    expect(localStorage.getItem('pwa-prompt-dismissed')).toBeTruthy();
  });

  it('should hide prompt after installation', async () => {
    render(<InstallPrompt />);

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = deferredPrompt.prompt;
    event.userChoice = deferredPrompt.userChoice;
    event.preventDefault = deferredPrompt.preventDefault;

    window.dispatchEvent(event);

    await waitFor(
      () => {
        expect(screen.getByText(/Install MediCare/i)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Trigger appinstalled event
    window.dispatchEvent(new Event('appinstalled'));

    await waitFor(() => {
      expect(screen.queryByText(/Install MediCare/i)).not.toBeInTheDocument();
    });
  });
});
