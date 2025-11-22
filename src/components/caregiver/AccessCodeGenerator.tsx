import { useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AccessCode } from '../../types';

interface AccessCodeGeneratorProps {
  patientId: string;
  onClose: () => void;
  onCodeGenerated: () => void;
}

export function AccessCodeGenerator({
  patientId,
  onClose,
  onCodeGenerated
}: AccessCodeGeneratorProps) {
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    try {
      setLoading(true);
      const code = await caregiverService.createAccessCode(patientId);
      setAccessCode(code);
      
      // Generate share link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/caregiver/register?code=${code.code}`;
      setShareLink(link);
      
      onCodeGenerated();
    } catch (error) {
      console.error('Error generating access code:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareViaEmail = () => {
    const subject = 'Caregiver Access to MediPal';
    const body = `I'd like to give you access to help me with my medications on MediPal.

Please use the following access code to register: ${accessCode?.code}

Or click this link to register directly: ${shareLink}

This code will expire in 24 hours.`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const message = `MediPal Caregiver Access Code: ${accessCode?.code}\n\nRegister here: ${shareLink}\n\n(Expires in 24 hours)`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Generate Caregiver Access Code
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!accessCode ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Generate a one-time access code to share with your caregiver. They can use this code
                to register and help you manage your medications.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The access code will expire in 24 hours and can only be used once.
                </p>
              </div>
              <Button
                onClick={generateCode}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Access Code'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Access Code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border rounded px-3 py-2 text-2xl font-mono font-bold text-center">
                    {accessCode.code}
                  </code>
                  <Button
                    onClick={() => copyToClipboard(accessCode.code)}
                    variant="secondary"
                    size="sm"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Expires: {new Date(accessCode.expiresAt).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-white border rounded px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareLink)}
                    variant="secondary"
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Share via:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={shareViaEmail} variant="secondary" className="w-full">
                    Email
                  </Button>
                  <Button onClick={shareViaSMS} variant="secondary" className="w-full">
                    SMS
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateCode}
                  variant="secondary"
                  className="flex-1"
                >
                  Generate New Code
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
