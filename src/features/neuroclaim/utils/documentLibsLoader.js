// utils/documentLibsLoader.js

/**
 * Utility for loading document processing libraries dynamically
 * This approach avoids module loading issues with Vite
 */

let librariesLoaded = false;
let loadingPromise = null;

export const documentLibs = {
  pdf: null,
  mammoth: null,
  tesseract: null
};

/**
 * Load all document processing libraries
 */
export const loadDocumentLibraries = async () => {
  if (librariesLoaded) return true;
  
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Load PDF.js
      if (!window.pdfjsLib) {
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
          'pdfjsLib'
        );
      }
      
      // Configure PDF.js worker with error handling
      if (window.pdfjsLib) {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          // Verify worker configuration
          console.log('PDF.js worker configured:', window.pdfjsLib.GlobalWorkerOptions.workerSrc);
          
          // Store reference
          documentLibs.pdf = window.pdfjsLib;
          
          // Test PDF.js is working by checking version
          if (window.pdfjsLib.version) {
            console.log('PDF.js version:', window.pdfjsLib.version);
          }
        } catch (error) {
          console.error('Error configuring PDF.js worker:', error);
          // Continue anyway - PDF.js might work without worker in some cases
        }
      } else {
        console.error('PDF.js library not available after loading');
      }

      // Load Mammoth
      if (!window.mammoth) {
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
          'mammoth'
        );
      }
      if (window.mammoth) {
        documentLibs.mammoth = window.mammoth;
        console.log('Mammoth.js loaded successfully');
      }

      librariesLoaded = true;
      
      // Final verification
      console.log('Document libraries loaded:', {
        pdf: !!documentLibs.pdf,
        mammoth: !!documentLibs.mammoth,
        pdfWorker: !!window.pdfjsLib?.GlobalWorkerOptions?.workerSrc
      });
      
      return true;
    } catch (error) {
      console.error('Failed to load document libraries:', error);
      loadingPromise = null; // Reset so it can be retried
      return false;
    }
  })();

  return loadingPromise;
};

/**
 * Load Tesseract.js on demand (it's larger)
 */
export const loadTesseract = async () => {
  if (documentLibs.tesseract) return documentLibs.tesseract;

  try {
    if (!window.Tesseract) {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
        'Tesseract'
      );
    }
    
    if (window.Tesseract) {
      documentLibs.tesseract = window.Tesseract;
      console.log('Tesseract.js loaded successfully');
      return window.Tesseract;
    }
  } catch (error) {
    console.error('Failed to load Tesseract:', error);
  }
  
  return null;
};

/**
 * Helper to load a script dynamically
 */
const loadScript = (src, globalName) => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (globalName && window[globalName]) {
      console.log(`${globalName} already loaded`);
      resolve();
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      console.log(`Script ${src} already in DOM`);
      
      // If it's still loading, wait for it
      if (globalName && !window[globalName]) {
        existingScript.addEventListener('load', resolve);
        existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
        return;
      }
      
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      console.log(`Loaded ${globalName || src}`);
      
      // Verify the library is actually available
      if (globalName && !window[globalName]) {
        reject(new Error(`${globalName} not available after script load`));
        return;
      }
      
      resolve();
    };
    
    script.onerror = (error) => {
      console.error(`Failed to load ${src}:`, error);
      reject(new Error(`Failed to load ${src}`));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Ensure libraries are loaded before using them
 */
export const ensureLibrariesLoaded = async () => {
  if (!librariesLoaded) {
    const success = await loadDocumentLibraries();
    if (!success) {
      throw new Error('Failed to load document processing libraries');
    }
  }
  return documentLibs;
};

/**
 * Verify PDF.js is properly configured
 */
export const verifyPDFJS = () => {
  if (!window.pdfjsLib) {
    return { loaded: false, error: 'PDF.js not loaded' };
  }
  
  if (!window.pdfjsLib.GlobalWorkerOptions?.workerSrc) {
    return { loaded: true, error: 'PDF.js worker not configured' };
  }
  
  return { 
    loaded: true, 
    version: window.pdfjsLib.version,
    workerSrc: window.pdfjsLib.GlobalWorkerOptions.workerSrc
  };
};