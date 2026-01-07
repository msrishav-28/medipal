import { useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AccessCode } from '../../types';
import { Copy, Share2, Mail, MessageSquare, X, RefreshCw, Key } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <GlassCard className="w-full max-w-md relative overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Generate Caregiver Code
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!accessCode ? (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Generate a one-time access code to share with your caregiver. They can use this code
                to register and help you manage your medications.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-amber-500 leading-relaxed">
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
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center">
                <label className="text-sm font-medium text-muted-foreground block mb-3 uppercase tracking-wider">
                  Access Code
                </label>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <code className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-3xl font-mono font-bold text-primary tracking-[0.2em]">
                    {accessCode.code}
                  </code>
                </div>
                <Button
                  onClick={() => copyToClipboard(accessCode.code)}
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 h-8"
                >
                  {copied ? 'Copied!' : <><Copy className="w-3 h-3 mr-2" /> Copy Code</>}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Expires: {new Date(accessCode.expiresAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground block">
                  Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono truncate"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareLink)}
                    variant="secondary"
                    size="sm"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/10">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share via:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={shareViaEmail} variant="outline" className="w-full gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Button>
                  <Button onClick={shareViaSMS} variant="outline" className="w-full gap-2">
                    <MessageSquare className="w-4 h-4" /> SMS
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={generateCode}
                  variant="ghost"
                  className="flex-1 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> New Code
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
      </GlassCard>
    </div>
  );
}
