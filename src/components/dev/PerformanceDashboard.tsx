/**
 * Performance Dashboard Component
 * Visual display of performance metrics and health indicators
 * Only rendered in development mode
 */

import { useState, useEffect } from 'react';
import {
  getPerformanceMetrics,
  getWebVitals,
  checkPerformanceHealth,
  getBundleInfo,
  VitalsMetrics,
  PerformanceMetrics,
} from '@/utils/performance';
import {
  runAccessibilityAudit,
  AccessibilityReport,
} from '@/utils/accessibility';
import {
  detectBrowser,
  checkFeatureSupport,
  isBrowserSupported,
  BrowserInfo,
  FeatureSupport,
} from '@/utils/browserCompat';

interface PerformanceDashboardProps {
  enabled?: boolean;
}

export function PerformanceDashboard({ enabled = import.meta.env.DEV }: PerformanceDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [vitals, setVitals] = useState<VitalsMetrics | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [a11yReport, setA11yReport] = useState<AccessibilityReport | null>(null);
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [features, setFeatures] = useState<FeatureSupport | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'accessibility' | 'browser'>('performance');

  useEffect(() => {
    if (!enabled) return;

    // Load initial data
    const loadData = async () => {
      const [vitalsData, metricsData, browserData, featuresData] = await Promise.all([
        getWebVitals(),
        Promise.resolve(getPerformanceMetrics()),
        Promise.resolve(detectBrowser()),
        Promise.resolve(checkFeatureSupport()),
      ]);

      setVitals(vitalsData);
      setMetrics(metricsData);
      setBrowser(browserData);
      setFeatures(featuresData);
    };

    loadData();
  }, [enabled]);

  const refreshAccessibility = () => {
    const report = runAccessibilityAudit();
    setA11yReport(report);
  };

  if (!enabled) return null;

  const health = checkPerformanceHealth();
  const bundleInfo = getBundleInfo();
  const browserSupport = isBrowserSupported();

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        aria-label="Toggle performance dashboard"
        style={{ display: enabled ? 'block' : 'none' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
      </button>

      {/* Dashboard panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
            <h2 className="text-h3 font-semibold">Dev Dashboard</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-neutral-200"
              aria-label="Close dashboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'performance'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => {
                setActiveTab('accessibility');
                if (!a11yReport) refreshAccessibility();
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'accessibility'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Accessibility
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'browser'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Browser
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[450px]">
            {activeTab === 'performance' && (
              <div className="space-y-4">
                {/* Health Status */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">Health Status</h3>
                  <div
                    className={`p-3 rounded-lg ${
                      health.healthy ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
                    }`}
                  >
                    {health.healthy ? '✅ Healthy' : '⚠️ Issues Detected'}
                  </div>
                  {health.issues.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {health.issues.map((issue, i) => (
                        <li key={i} className="text-xs text-neutral-600">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Web Vitals */}
                {vitals && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-2">Web Vitals</h3>
                    <div className="space-y-2">
                      {vitals.FCP && (
                        <MetricBar
                          label="FCP"
                          value={vitals.FCP}
                          max={3000}
                          good={1800}
                          unit="ms"
                        />
                      )}
                      {vitals.LCP && (
                        <MetricBar
                          label="LCP"
                          value={vitals.LCP}
                          max={4000}
                          good={2500}
                          unit="ms"
                        />
                      )}
                      {vitals.TTFB && (
                        <MetricBar
                          label="TTFB"
                          value={vitals.TTFB}
                          max={1800}
                          good={800}
                          unit="ms"
                        />
                      )}
                      {vitals.CLS !== undefined && (
                        <MetricBar
                          label="CLS"
                          value={vitals.CLS}
                          max={0.25}
                          good={0.1}
                          unit=""
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Bundle Info */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">Bundle Size</h3>
                  <div className="text-xs text-neutral-600">
                    <p>Total: {(bundleInfo.totalSize / 1024).toFixed(2)} KB</p>
                    <p>Resources: {bundleInfo.resources.length}</p>
                  </div>
                </div>

                {/* Memory Info */}
                {metrics?.memoryInfo && (
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-2">Memory Usage</h3>
                    <MetricBar
                      label="Heap"
                      value={metrics.memoryInfo.usedJSHeapSize}
                      max={metrics.memoryInfo.jsHeapSizeLimit}
                      good={metrics.memoryInfo.jsHeapSizeLimit * 0.5}
                      unit="MB"
                      divisor={1048576}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-800">A11y Report</h3>
                  <button
                    onClick={refreshAccessibility}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Refresh
                  </button>
                </div>

                {a11yReport ? (
                  <>
                    {/* Summary */}
                    <div
                      className={`p-3 rounded-lg ${
                        a11yReport.passed ? 'bg-success-50' : 'bg-error-50'
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          a11yReport.passed ? 'text-success-700' : 'text-error-700'
                        }`}
                      >
                        {a11yReport.passed ? '✅ Passed' : '❌ Failed'}
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">
                        {a11yReport.summary.total} issues found
                      </p>
                    </div>

                    {/* WCAG Compliance */}
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-700 mb-2">
                        WCAG Compliance
                      </h4>
                      <div className="space-y-1">
                        <ComplianceBadge
                          level="A"
                          passed={a11yReport.wcagCompliance.levelA}
                        />
                        <ComplianceBadge
                          level="AA"
                          passed={a11yReport.wcagCompliance.levelAA}
                        />
                        <ComplianceBadge
                          level="AAA"
                          passed={a11yReport.wcagCompliance.levelAAA}
                        />
                      </div>
                    </div>

                    {/* Issues */}
                    {a11yReport.issues.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-700 mb-2">
                          Issues ({a11yReport.summary.total})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {a11yReport.issues.slice(0, 10).map((issue, i) => (
                            <div
                              key={i}
                              className="p-2 bg-neutral-50 rounded text-xs"
                            >
                              <p className="font-medium text-neutral-800">
                                {issue.type}
                              </p>
                              <p className="text-neutral-600 mt-1">{issue.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-neutral-600">
                    Click refresh to run accessibility audit
                  </p>
                )}
              </div>
            )}

            {activeTab === 'browser' && browser && features && (
              <div className="space-y-4">
                {/* Browser Info */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">Browser</h3>
                  <div className="text-xs text-neutral-600 space-y-1">
                    <p>Name: {browser.name}</p>
                    <p>Version: {browser.version}</p>
                    <p>Platform: {browser.platform}</p>
                    <p>
                      Device:{' '}
                      {browser.isMobile ? 'Mobile' : browser.isTablet ? 'Tablet' : 'Desktop'}
                    </p>
                  </div>
                </div>

                {/* Support Status */}
                <div>
                  <div
                    className={`p-3 rounded-lg ${
                      browserSupport.supported ? 'bg-success-50' : 'bg-error-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        browserSupport.supported ? 'text-success-700' : 'text-error-700'
                      }`}
                    >
                      {browserSupport.supported ? '✅ Supported' : '❌ Not Supported'}
                    </p>
                    {browserSupport.reason && (
                      <p className="text-xs mt-1 text-neutral-600">{browserSupport.reason}</p>
                    )}
                  </div>
                </div>

                {/* Feature Support */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800 mb-2">
                    Feature Support
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(features).map(([feature, supported]) => (
                      <div key={feature} className="flex items-center gap-1">
                        <span>{supported ? '✅' : '❌'}</span>
                        <span className="text-neutral-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Helper components
function MetricBar({
  label,
  value,
  max,
  good,
  unit,
  divisor = 1,
}: {
  label: string;
  value: number;
  max: number;
  good: number;
  unit: string;
  divisor?: number;
}) {
  const displayValue = value / divisor;
  const percentage = Math.min((value / max) * 100, 100);
  const isGood = value <= good;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-neutral-700">{label}</span>
        <span className="text-xs text-neutral-600">
          {displayValue.toFixed(divisor === 1 ? 0 : 2)}
          {unit}
        </span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isGood ? 'bg-success-500' : 'bg-warning-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ComplianceBadge({ level, passed }: { level: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
      <span className="text-xs font-medium text-neutral-700">WCAG {level}</span>
      <span className="text-xs">{passed ? '✅ Pass' : '❌ Fail'}</span>
    </div>
  );
}
