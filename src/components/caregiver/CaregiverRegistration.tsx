import { useState } from 'react';
import { caregiverService } from '../../services/caregiverService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600">
              You've been successfully registered as a caregiver. Redirecting to your dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Caregiver Registration
            </h1>
            <p className="text-gray-600">
              Enter your access code and information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full uppercase"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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
              <p className="text-xs text-gray-500 mt-1">
                For SMS notifications
              </p>
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Partner">Partner</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Healthcare Provider">Healthcare Provider</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Access codes expire in 24 hours. If your code doesn't work,
                please request a new one from the patient.
              </p>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
