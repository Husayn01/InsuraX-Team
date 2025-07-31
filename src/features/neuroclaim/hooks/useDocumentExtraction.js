// hooks/useDocumentExtraction.js
import { useState, useEffect, useRef } from 'react';
import { ClaimsProcessingSystem } from '@features/neuroclaim/services/claimsOrchestrator';

export const useDocumentExtraction = () => {
  const [isReady, setIsReady] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const claimsSystemRef = useRef(null);

  useEffect(() => {
    // Initialize the claims processing system
    const initializeSystem = async () => {
      try {
        console.log('Initializing document extraction system...');
        const system = new ClaimsProcessingSystem();
        claimsSystemRef.current = system;
        
        // Wait for Tesseract to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsReady(true);
        console.log('Document extraction system ready');
      } catch (error) {
        console.error('Failed to initialize document extraction:', error);
      }
    };

    initializeSystem();

    // Cleanup on unmount
    return () => {
      if (claimsSystemRef.current) {
        claimsSystemRef.current.cleanup();
      }
    };
  }, []);

  const extractFromDocuments = async (documents) => {
    if (!isReady || !claimsSystemRef.current) {
      throw new Error('Document extraction system not ready');
    }

    const extractedTexts = [];
    const totalDocs = documents.length;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      setExtractionProgress(((i + 1) / totalDocs) * 100);

      try {
        console.log(`Extracting text from ${doc.name}...`);
        const text = await claimsSystemRef.current.extractTextFromFile(doc.file || doc);
        extractedTexts.push({
          fileName: doc.name,
          text: text,
          success: true
        });
      } catch (error) {
        console.error(`Failed to extract from ${doc.name}:`, error);
        extractedTexts.push({
          fileName: doc.name,
          text: '',
          success: false,
          error: error.message
        });
      }
    }

    setExtractionProgress(100);
    return extractedTexts;
  };

  const processClaimDocuments = async (documents, additionalText = '') => {
    const extractedTexts = await extractFromDocuments(documents);
    
    // Combine all successful extractions
    const combinedText = extractedTexts
      .filter(result => result.success && result.text)
      .map(result => `--- Document: ${result.fileName} ---\n${result.text}`)
      .join('\n\n') + (additionalText ? `\n\n--- Additional Information ---\n${additionalText}` : '');

    // Process the combined text
    const result = await claimsSystemRef.current.processClaimComplete(combinedText, {
      generateCustomerResponse: true,
      customerFriendly: true
    });

    return {
      extractedTexts,
      processingResult: result,
      combinedText
    };
  };

  return {
    isReady,
    extractionProgress,
    extractFromDocuments,
    processClaimDocuments,
    claimsSystem: claimsSystemRef.current
  };
};

// Export a singleton instance for shared use
let sharedInstance = null;

export const getSharedDocumentExtractor = () => {
  if (!sharedInstance) {
    sharedInstance = new ClaimsProcessingSystem();
  }
  return sharedInstance;
};