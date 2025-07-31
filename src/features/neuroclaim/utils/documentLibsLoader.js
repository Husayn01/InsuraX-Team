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
      
      // Configure PDF.js worker
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        documentLibs.pdf = window.pdfjsLib;
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
      }

      librariesLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load document libraries:', error);
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
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      console.log(`Loaded ${globalName || src}`);
      resolve();
    };
    
    script.onerror = () => {
      console.error(`Failed to load ${src}`);
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