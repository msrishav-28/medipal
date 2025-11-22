/**
 * Accessibility Audit Utilities
 * Tools for checking and improving application accessibility
 */

export interface AccessibilityIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  element: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  help: string;
}

export interface AccessibilityReport {
  passed: boolean;
  issues: AccessibilityIssue[];
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  wcagCompliance: {
    levelA: boolean;
    levelAA: boolean;
    levelAAA: boolean;
  };
}

/**
 * Check color contrast ratio between foreground and background
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1]!, 16),
          parseInt(result[2]!, 16),
          parseInt(result[3]!, 16),
        ]
      : [0, 0, 0];
  };

  // Calculate relative luminance
  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((val) => {
      const sRGB = val / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };

  const fgLuminance = getLuminance(hexToRgb(foreground));
  const bgLuminance = getLuminance(hexToRgb(background));

  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5, // WCAG AA standard for normal text
    passesAAA: ratio >= 7, // WCAG AAA standard for normal text
  };
}

/**
 * Check if element has sufficient touch target size (mobile)
 */
export function checkTouchTargetSize(element: HTMLElement): {
  passes: boolean;
  width: number;
  height: number;
  minSize: number;
} {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // Apple's recommended minimum: 44x44 points
  const passes = rect.width >= minSize && rect.height >= minSize;

  return {
    passes,
    width: rect.width,
    height: rect.height,
    minSize,
  };
}

/**
 * Check if images have alt text
 */
export function checkImageAltText(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const images = container.querySelectorAll('img');

  images.forEach((img, index) => {
    if (!img.alt && img.getAttribute('role') !== 'presentation') {
      issues.push({
        severity: 'critical',
        type: 'missing-alt-text',
        element: `img[src="${img.src}"]`,
        message: `Image at index ${index} is missing alt text`,
        wcagLevel: 'A',
        help: 'Add descriptive alt text to all images. Use alt="" for decorative images.',
      });
    }
  });

  return issues;
}

/**
 * Check if form inputs have labels
 */
export function checkFormLabels(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const inputs = container.querySelectorAll('input, select, textarea');

  inputs.forEach((input) => {
    const id = input.id;
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        severity: 'critical',
        type: 'missing-form-label',
        element: `${input.tagName.toLowerCase()}${id ? `#${id}` : ''}`,
        message: `Form input is missing an accessible label`,
        wcagLevel: 'A',
        help: 'Add a <label> element with a "for" attribute, or use aria-label/aria-labelledby.',
      });
    }
  });

  return issues;
}

/**
 * Check if interactive elements are keyboard accessible
 */
export function checkKeyboardAccessibility(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [onclick], [role="button"]'
  );

  interactiveElements.forEach((element) => {
    const tabIndex = element.getAttribute('tabindex');
    const isHidden = (element as HTMLElement).style.display === 'none' ||
                    (element as HTMLElement).style.visibility === 'hidden';

    if (!isHidden && tabIndex === '-1' && !element.hasAttribute('disabled')) {
      issues.push({
        severity: 'serious',
        type: 'keyboard-inaccessible',
        element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
        message: 'Interactive element is not keyboard accessible (tabindex="-1")',
        wcagLevel: 'A',
        help: 'Remove tabindex="-1" or ensure element can be accessed via keyboard.',
      });
    }

    // Check if clickable divs/spans have proper ARIA roles and keyboard handlers
    if ((element.tagName === 'DIV' || element.tagName === 'SPAN') && element.hasAttribute('onclick')) {
      const hasRole = element.hasAttribute('role');
      const hasKeyHandler = element.hasAttribute('onkeydown') || element.hasAttribute('onkeypress');

      if (!hasRole || !hasKeyHandler) {
        issues.push({
          severity: 'serious',
          type: 'improper-interactive-element',
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
          message: 'Clickable element should be a button or have proper ARIA role and keyboard handler',
          wcagLevel: 'A',
          help: 'Use a <button> element or add role="button" and keyboard event handlers.',
        });
      }
    }
  });

  return issues;
}

/**
 * Check heading hierarchy
 */
export function checkHeadingHierarchy(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  let previousLevel = 0;
  headings.forEach((heading) => {
    const currentLevel = parseInt(heading.tagName.charAt(1) || '1');
    
    if (previousLevel > 0 && currentLevel - previousLevel > 1) {
      issues.push({
        severity: 'moderate',
        type: 'heading-hierarchy-skip',
        element: heading.tagName.toLowerCase(),
        message: `Heading levels should not skip. Found ${heading.tagName} after h${previousLevel}`,
        wcagLevel: 'A',
        help: 'Ensure heading levels increase by one at a time (h1, h2, h3, not h1, h3).',
      });
    }
    
    previousLevel = currentLevel;
  });
  
  // Check if page has h1
  const h1Count = headings.filter(h => h.tagName === 'H1').length;
  if (h1Count === 0) {
    issues.push({
      severity: 'serious',
      type: 'missing-h1',
      element: 'page',
      message: 'Page is missing an h1 heading',
      wcagLevel: 'A',
      help: 'Every page should have exactly one h1 heading describing the page content.',
    });
  } else if (h1Count > 1) {
    issues.push({
      severity: 'moderate',
      type: 'multiple-h1',
      element: 'page',
      message: `Page has ${h1Count} h1 headings, should have only one`,
      wcagLevel: 'A',
      help: 'Use only one h1 heading per page. Use h2-h6 for subheadings.',
    });
  }
  
  return issues;
}

/**
 * Check ARIA attributes validity
 */
export function checkAriaAttributes(container: HTMLElement = document.body): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
  
  elementsWithAria.forEach((element) => {
    // Check if aria-labelledby references exist
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ids = labelledBy.split(' ');
      ids.forEach(id => {
        if (!container.querySelector(`#${id}`)) {
          issues.push({
            severity: 'serious',
            type: 'invalid-aria-reference',
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
            message: `aria-labelledby references non-existent element: ${id}`,
            wcagLevel: 'A',
            help: 'Ensure all ARIA reference IDs point to existing elements.',
          });
        }
      });
    }
    
    // Check if aria-describedby references exist
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const ids = describedBy.split(' ');
      ids.forEach(id => {
        if (!container.querySelector(`#${id}`)) {
          issues.push({
            severity: 'moderate',
            type: 'invalid-aria-reference',
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
            message: `aria-describedby references non-existent element: ${id}`,
            wcagLevel: 'A',
            help: 'Ensure all ARIA reference IDs point to existing elements.',
          });
        }
      });
    }
  });
  
  return issues;
}

/**
 * Run a comprehensive accessibility audit
 */
export function runAccessibilityAudit(container: HTMLElement = document.body): AccessibilityReport {
  const issues: AccessibilityIssue[] = [
    ...checkImageAltText(container),
    ...checkFormLabels(container),
    ...checkKeyboardAccessibility(container),
    ...checkHeadingHierarchy(container),
    ...checkAriaAttributes(container),
  ];
  
  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    serious: issues.filter(i => i.severity === 'serious').length,
    moderate: issues.filter(i => i.severity === 'moderate').length,
    minor: issues.filter(i => i.severity === 'minor').length,
    total: issues.length,
  };
  
  const wcagCompliance = {
    levelA: summary.critical === 0 && summary.serious === 0,
    levelAA: summary.critical === 0 && summary.serious === 0 && summary.moderate === 0,
    levelAAA: summary.critical === 0 && summary.serious === 0 && summary.moderate === 0 && summary.minor === 0,
  };
  
  return {
    passed: summary.critical === 0 && summary.serious === 0,
    issues,
    summary,
    wcagCompliance,
  };
}

/**
 * Log accessibility report to console
 */
export function logAccessibilityReport(container?: HTMLElement): void {
  const report = runAccessibilityAudit(container);
  
  console.group('♿ Accessibility Audit Report');
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('\nSummary:');
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  Serious: ${report.summary.serious}`);
  console.log(`  Moderate: ${report.summary.moderate}`);
  console.log(`  Minor: ${report.summary.minor}`);
  console.log(`  Total: ${report.summary.total}`);
  
  console.log('\nWCAG Compliance:');
  console.log(`  Level A: ${report.wcagCompliance.levelA ? '✅' : '❌'}`);
  console.log(`  Level AA: ${report.wcagCompliance.levelAA ? '✅' : '❌'}`);
  console.log(`  Level AAA: ${report.wcagCompliance.levelAAA ? '✅' : '❌'}`);
  
  if (report.issues.length > 0) {
    console.log('\nIssues:');
    report.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`   Element: ${issue.element}`);
      console.log(`   Message: ${issue.message}`);
      console.log(`   WCAG Level: ${issue.wcagLevel}`);
      console.log(`   Help: ${issue.help}`);
    });
  }
  
  console.groupEnd();
}

/**
 * Enable accessibility debugging mode
 */
export function enableAccessibilityDebug(): void {
  if (import.meta.env.DEV) {
    // Add visual indicators for accessibility issues
    const style = document.createElement('style');
    style.innerHTML = `
      /* Highlight images without alt text */
      img:not([alt]) {
        outline: 3px solid red !important;
        outline-offset: 2px;
      }
      
      /* Highlight form inputs without labels */
      input:not([aria-label]):not([aria-labelledby]):not(:placeholder-shown),
      select:not([aria-label]):not([aria-labelledby]),
      textarea:not([aria-label]):not([aria-labelledby]) {
        outline: 3px solid orange !important;
        outline-offset: 2px;
      }
      
      /* Highlight elements with keyboard accessibility issues */
      [onclick]:not(button):not(a):not([role="button"]) {
        outline: 3px solid yellow !important;
        outline-offset: 2px;
      }
      
      /* Show focus indicators */
      *:focus {
        outline: 3px solid blue !important;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
    
    console.log('♿ Accessibility debugging enabled');
    console.log('Red outline: Images without alt text');
    console.log('Orange outline: Form inputs without labels');
    console.log('Yellow outline: Clickable non-button elements');
    console.log('Blue outline: Focused elements');
  }
}
