import { useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, UserPlus, AlertCircle, Info } from 'lucide-react';

interface CaregiverRegistrationProps {
  code?: string;
  onSuccess?: () => void;
}

export function CaregiverRegistration({ code: initialCode, onSuccess }: CaregiverRegistrationProps) {
  const [formData, setFormData] = useState({
    code: initialCode || '',
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const caregiverData: {
        name: string;
        email: string;
        phone?: string;
        relationship: string;
      } = {
        name: formData.name,
        email: formData.email,
        relationship: formData.relationship
      };

      if (formData.phone) {
        caregiverData.phone = formData.phone;
      }

      await caregiverService.registerCaregiver(formData.code, caregiverData);

      setSuccess(true);

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please check your access code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md border-green-500/20 bg-green-500/5">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Registration Successful!
            </h2>
            <p className="text-muted-foreground">
              You've been successfully registered as a caregiver. Redirecting to your dashboard...
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Caregiver Registration
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your access code and information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">
                Access Code *
              </label>
              <Input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter 6-character code"
                required
                maxLength={6}
                className="w-full uppercase text-center tracking-[0.2em] font-mono text-lg"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                Phone Number (Optional)
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For SMS notifications
              </p>
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-foreground mb-1.5">
                Relationship *
              </label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none"
              >
                <option value="" className="bg-neutral-900 text-muted-foreground">Select relationship</option>
                <option value="Spouse" className="bg-neutral-900">Spouse</option>
                <option value="Partner" className="bg-neutral-900">Partner</option>
                <option value="Parent" className="bg-neutral-900">Parent</option>
                <option value="Child" className="bg-neutral-900">Child</option>
                <option value="Sibling" className="bg-neutral-900">Sibling</option>
                <option value="Friend" className="bg-neutral-900">Friend</option>
                <option value="Healthcare Provider" className="bg-neutral-900">Healthcare Provider</option>
                <option value="Other" className="bg-neutral-900">Other</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Registering...' : 'Register as Caregiver'}
            </Button>

            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 mt-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                <strong>Note:</strong> Access codes expire in 24 hours. If your code doesn't work,
                please request a new one from the patient.
              </p>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
