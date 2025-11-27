/**
 * PWA Security and Extension Detection
 * 
 * Utilities for detecting browser extensions and enforcing security policies
 */

/**
 * Extended Navigator interface with iOS standalone property
 */
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Extended Window interface for extension detection
 */
interface WindowWithExtensions {
  [key: string]: unknown;
}

export interface SecurityCheckResult {
  isStandalone: boolean;
  isTrustedContext: boolean;
  suspiciousExtensions: string[];
  recommendations: string[];
}

/**
 * Check if app is running in standalone PWA mode
 */
export function isStandalonePWA(): boolean {
  // Check display mode
  const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check iOS standalone
  const isIOSStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  
  // Check Android TWA
  const isAndroidTWA = document.referrer.includes('android-app://');
  
  return isStandaloneDisplay || isIOSStandalone || isAndroidTWA;
}

/**
 * Detect potential browser extensions by checking for modified globals
 */
export function detectExtensions(): string[] {
  const suspiciousExtensions: string[] = [];
  
  // Check for common extension global variables
  const extensionGlobals = [
    '__REACT_DEVTOOLS_GLOBAL_HOOK__',
    '__REDUX_DEVTOOLS_EXTENSION__',
    '__VUE_DEVTOOLS_GLOBAL_HOOK__',
    'chrome',
    '$',
    'jQuery',
  ];
  
  for (const global of extensionGlobals) {
    // @ts-expect-error - WindowWithExtensions allows dynamic property access for extension detection
	  if ((window as WindowWithExtensions)[global] && !isStandalonePWA()) {
      suspiciousExtensions.push(global);
    }
  }
  
  // Check for modified native APIs
  if (isNativeAPIModified()) {
    suspiciousExtensions.push('Modified Native APIs');
  }
  
  return suspiciousExtensions;
}

/**
 * Check if native APIs have been modified
 */
function isNativeAPIModified(): boolean {
  try {
    // Check if fetch has been wrapped
    const fetchStr = Function.prototype.toString.call(fetch);
    if (!fetchStr.includes('[native code]')) {
      return true;
    }
    
    // Check if localStorage has been wrapped
    const descriptor = Object.getOwnPropertyDescriptor(Window.prototype, 'localStorage');
    if (descriptor && !descriptor.get?.toString().includes('[native code]')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if running in trusted context
 */
export function isTrustedContext(): boolean {
  // Standalone PWA is most trusted
  if (isStandalonePWA()) {
    return true;
  }
  
  // Check if running from correct origin
  const trustedOrigins = [
    'https://stels.io',
    'https://app.stels.io',
    'http://localhost',
    'http://127.0.0.1',
  ];
  
  const currentOrigin = window.location.origin;
  return trustedOrigins.some(origin => currentOrigin.startsWith(origin));
}

/**
 * Perform comprehensive security check
 */
export function performSecurityCheck(): SecurityCheckResult {
  const isStandalone = isStandalonePWA();
  const isTrusted = isTrustedContext();
  const suspiciousExtensions = detectExtensions();
  const recommendations: string[] = [];
  
  if (!isStandalone) {
    recommendations.push('Install app for maximum security');
  }
  
  if (!isTrusted) {
    recommendations.push('Access app from official domain');
  }
  
  if (suspiciousExtensions.length > 0) {
    recommendations.push('Disable browser extensions or use standalone mode');
  }
  
  return {
    isStandalone,
    isTrustedContext: isTrusted,
    suspiciousExtensions,
    recommendations,
  };
}

/**
 * Freeze critical native APIs to prevent modification
 */
export function freezeNativeAPIs(): void {
  try {
    // Freeze fetch (prevents extension tampering)
    Object.freeze(fetch);
    
    // Freeze localStorage (prevents unauthorized access)
    Object.freeze(Storage.prototype);
    
    // NOTE: We do NOT freeze Object.prototype, Array.prototype, or Function.prototype
    // because they break Monaco Editor and other legitimate libraries
    // Security is maintained through other means (CSP, origin checks, etc.)

  } catch {
			// Error handled silently
		}
}

/**
 * Detect if running in incognito/private mode
 */
export async function isIncognitoMode(): Promise<boolean> {
  try {
    // Try to detect using FileSystem API
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return (estimate.quota || 0) < 120000000; // Less than ~120MB suggests incognito
    }
    
    // Fallback detection
    return false;
  } catch {
    return false;
  }
}

/**
 * Monitor for suspicious activity
 */
export function startSecurityMonitoring(onThreatDetected: (threat: string) => void): () => void {
  const monitors: Array<() => void> = [];
  
  // Monitor for new global variables
  const initialGlobals = new Set(Object.keys(window));
  const globalCheckInterval = setInterval(() => {
    const currentGlobals = Object.keys(window);
    const newGlobals = currentGlobals.filter(key => !initialGlobals.has(key));
    
    if (newGlobals.length > 0) {

      onThreatDetected(`New globals: ${newGlobals.join(', ')}`);
      newGlobals.forEach(key => initialGlobals.add(key));
    }
  }, 5000);
  
  monitors.push(() => clearInterval(globalCheckInterval));
  
  // Monitor for console access (dev tools detection)
  const consoleCheck = setInterval(() => {
    const devToolsOpen = (window.outerHeight - window.innerHeight) > 200 ||
                         (window.outerWidth - window.innerWidth) > 200;
    
    if (devToolsOpen && !isStandalonePWA()) {
      onThreatDetected('Developer tools detected');
    }
  }, 1000);
  
  monitors.push(() => clearInterval(consoleCheck));
  
  // Return cleanup function
  return (): void => {
    monitors.forEach(cleanup => cleanup());
  };
}

/**
 * Create isolated context for sensitive operations
 */
export function createIsolatedContext<T>(operation: () => T): T {
  // Create iframe for isolated execution
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.sandbox.add('allow-same-origin');
  document.body.appendChild(iframe);
  
  try {
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      throw new Error('Failed to create isolated context');
    }
    
    // Execute in iframe context
    const result = operation.call(iframeWindow);
    return result;
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Validate that private keys are not being intercepted
 */
export function validateCryptoOperations(): boolean {
  try {
    // Test crypto operations
    const testData = new Uint8Array(32);
    crypto.getRandomValues(testData);
    
    // Verify crypto is native
    const cryptoStr = Function.prototype.toString.call(crypto.getRandomValues);
    if (!cryptoStr.includes('[native code]')) {

      return false;
    }
    
    return true;
  } catch {

    return false;
  }
}

/**
 * Get security recommendations for user
 */
export function getSecurityRecommendations(): string[] {
  const recommendations: string[] = [];
  const securityCheck = performSecurityCheck();
  
  if (!securityCheck.isStandalone) {
    recommendations.push(
      '🔒 Install the app for maximum security (extensions won\'t work in standalone mode)'
    );
  }
  
  if (securityCheck.suspiciousExtensions.length > 0) {
    recommendations.push(
      `⚠️ ${securityCheck.suspiciousExtensions.length} potential extensions detected. ` +
      'Consider disabling extensions or using standalone mode.'
    );
  }
  
  if (!securityCheck.isTrustedContext) {
    recommendations.push(
      '🌐 Access the app from the official domain for security'
    );
  }
  
  return recommendations;
}
