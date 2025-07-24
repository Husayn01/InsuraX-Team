import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Brain, Zap, CheckCircle, 
  AlertCircle, TrendingUp, Clock, DollarSign,
  Shield, Activity, BarChart3, X, Loader2,
  File, Image, FileCheck, AlertTriangle,
  ChevronDown, ChevronUp, Download, RefreshCw
} from 'lucide-react';
import { Alert, Button, Badge, Card, CardBody, LoadingSpinner } from '@shared/components';
import { geminiClient } from '../utils/geminiClient';
import { ClaimsProcessingSystem} from '../services/claimsOrchestrator';
import { GEMINI_CONFIG } from '../config/gemini';

export const ClaimsProcessingDemo = () => {
  const [documentText, setDocumentText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState('process');
  const [allClaims, setAllClaims] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize the enhanced orchestrator
 const enhancedSystem = new ClaimsProcessingSystem();

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setApiKeyStatus('checking');
        
        const hasApiKey = GEMINI_CONFIG.apiKey && 
                         GEMINI_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' && 
                         !GEMINI_CONFIG.apiKey.includes('YOUR')
        
        if (!hasApiKey) {
          setApiKeyStatus('missing');
          setErrorMessage('Gemini API key not found. For demo purposes, you can view the interface without AI processing.');
          return;
        }

        // Test the connection
        setIsTestingConnection(true);
        const testResult = await geminiClient.testConnection();
        setIsTestingConnection(false);

        if (testResult.success) {
          setApiKeyStatus('configured');
          setErrorMessage('');
        } else {
          setApiKeyStatus('error');
          setErrorMessage(testResult.error || 'Failed to connect to Gemini API');
        }
      } catch (error) {
        setApiKeyStatus('error');
        setErrorMessage(error.message || 'Error checking API connection');
        setIsTestingConnection(false);
      }
    };

    checkApiKey();
    setIsLoaded(true);
  }, []);

  const sampleDocuments = [
    {
      title: "Auto Accident Claim - Rear-end Collision",
      content: `CLAIM FORM - AUTO ACCIDENT
      
Claim Number: CLM-2024-001234
Policy Number: AUTO-789456
Date of Incident: March 15, 2024
Date of Claim: March 16, 2024

Claimant Information:
Name: Adebayo Ogundimu
Address: 45 Victoria Island, Lagos, Nigeria
Phone: +234 802 345 6789

Incident Details:
I was stopped at a red light on Ozumba Mbadiwe Avenue when the vehicle behind me failed to stop and rear-ended my car. The impact pushed my vehicle forward into the intersection. The other driver admitted they were distracted and didn't see the red light in time.

Vehicle Information:
Make: Toyota
Model: Camry
Year: 2020
License Plate: LAG-123AB

Damage Description:
- Rear bumper completely crushed
- Trunk won't close properly
- Rear lights broken
- Possible frame damage

Estimated Repair Cost: ₦1,850,000

Witness Information:
Chioma Nwosu witnessed the accident from the sidewalk. Phone: +234 803 456 7890

Medical Treatment:
Went to Lagos University Teaching Hospital for neck pain. X-rays negative. Prescribed muscle relaxants.`
    },
    {
      title: "Health Insurance Claim - Surgery",
      content: `HEALTH INSURANCE CLAIM FORM

Claim Number: HC-2024-005678
Policy Number: HEALTH-456789
Patient Name: Fatima Mohammed
Date of Service: February 28, 2024

Provider Information:
Hospital: Reddington Hospital, Lagos
Doctor: Dr. Oluwaseun Akinola, MD
Provider ID: PRV-123456

Procedure Details:
Diagnosis: Acute Appendicitis
Procedure: Laparoscopic Appendectomy
CPT Code: 44970

Itemized Charges:
- Surgery: ₦2,500,000
- Anesthesia: ₦550,000
- Hospital Room (2 days): ₦650,000
- Medications: ₦120,000
- Lab Tests: ₦180,000

Total Charges: ₦4,000,000

Insurance Information:
Primary Insurance: NaijaHealth Insurance
Group Number: GRP-789
Deductible Met: ₦350,000 of ₦500,000

Pre-Authorization: Obtained on February 27, 2024
Auth Number: AUTH-2024-9876`
    },
    {
      title: "Property Claim - Water Damage",
      content: `PROPERTY DAMAGE CLAIM

Claim Number: PROP-2024-009876
Policy Number: HOME-321654
Date of Loss: January 10, 2024

Policyholder: Emeka Okafor
Property Address: 78 Ikoyi Crescent, Lagos, Nigeria

Description of Loss:
During the heavy rains last week, water leaked through the roof while we were away for the weekend. Water damage occurred for approximately 48 hours before we discovered it. 

Affected Areas:
- Master bedroom ceiling and walls
- Hallway flooring
- Kitchen ceiling (below bathroom)
- Various personal belongings

Immediate Actions Taken:
- Called emergency water extraction service
- Moved undamaged belongings to safe area
- Took extensive photos of damage

Estimated Damages:
- Water extraction and drying: ₦750,000
- Ceiling repairs: ₦600,000
- Flooring replacement: ₦900,000
- Wall repairs and painting: ₦650,000
- Personal property: ₦450,000

Total Estimate: ₦3,350,000

Contractor: Lagos Restoration Services
Contact: +234 805 678 9012`
    }
  ];

const processDocument = async () => {
  if (!documentText.trim() && uploadedFiles.length === 0) {
    setErrorMessage('Please enter claim text or upload a document');
    setTimeout(() => setErrorMessage(''), 3000);
    return;
  }

  if (apiKeyStatus !== 'configured') {
    setErrorMessage('This is a demo version. To use AI processing, please configure your Gemini API key.');
    setTimeout(() => setErrorMessage(''), 5000);
    return;
  }

  setProcessing(true);
  setCurrentResult(null);
  setErrorMessage('');

  try {
    let textToProcess = documentText;

    // If files are uploaded, extract text from them
    if (uploadedFiles.length > 0) {
      const extractedTexts = await Promise.all(
        uploadedFiles.map(file => enhancedSystem.extractTextFromFile(file))
      );
      textToProcess = extractedTexts.join('\n\n---\n\n') + '\n\n' + documentText;
    }

    const result = await enhancedSystem.processClaimComplete(textToProcess, {
      generateCustomerResponse: true,
      customerFriendly: true
    });

    if (result.success) {
      setCurrentResult(result.result);
      const claims = enhancedSystem.getAllClaims();
      setAllClaims(claims);
      updateAnalytics();
    } else {
      throw new Error(result.error || 'Processing failed');
    }
  } catch (error) {
    console.error('Processing error:', error);
    setErrorMessage(`Processing failed: ${error.message}`);
    setCurrentResult(null);
  } finally {
    setProcessing(false);
  }
};

  const updateAnalytics = () => {
    const analytics = enhancedSystem.generateAnalytics();
    setAnalytics(analytics);
  };

  const loadSampleDocument = (sample) => {
    setDocumentText(sample.content);
    setUploadedFiles([]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return enhancedSystem.supportedFileTypes.includes(extension);
    });

    if (validFiles.length !== fileArray.length) {
      alert('Some files were not supported. Supported formats: ' + enhancedSystem.supportedFileTypes.join(', '));
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  // Render different tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'process':
        return renderProcessTab();
      case 'claims':
        return renderClaimsTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  const renderProcessTab = () => (
    <div className="space-y-8">
      {/* Error Alert */}
      {errorMessage && apiKeyStatus !== 'missing' && (
        <div className={`border rounded-lg p-4 ${
          apiKeyStatus === 'missing' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-red-900/20 border-red-500/50'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${
              apiKeyStatus === 'missing' ? 'text-blue-400' : 'text-red-400'
            }`} />
            <h3 className={`font-semibold ${
              apiKeyStatus === 'missing' ? 'text-blue-400' : 'text-red-400'
            }`}>
              {apiKeyStatus === 'missing' ? 'Demo Mode' : 'Error'}
            </h3>
          </div>
          <p className={`mt-2 text-sm ${
            apiKeyStatus === 'missing' ? 'text-blue-300' : 'text-red-300'
          }`}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* API Status Section */}
      <div className={`border rounded-lg p-4 ${
        apiKeyStatus === 'configured' ? 'bg-green-900/20 border-green-500/50' :
        apiKeyStatus === 'missing' ? 'bg-blue-900/20 border-blue-500/50' :
        apiKeyStatus === 'error' ? 'bg-red-900/20 border-red-500/50' :
        'bg-yellow-900/20 border-yellow-500/50'
      }`}>
        <div className="flex items-center gap-2">
          {apiKeyStatus === 'configured' && <CheckCircle className="w-5 h-5 text-green-400" />}
          {apiKeyStatus === 'missing' && <AlertCircle className="w-5 h-5 text-blue-400" />}
          {apiKeyStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {apiKeyStatus === 'checking' && <Clock className="w-5 h-5 text-yellow-400 animate-spin" />}
          
          <h3 className={`font-semibold ${
            apiKeyStatus === 'configured' ? 'text-green-400' :
            apiKeyStatus === 'missing' ? 'text-blue-400' :
            apiKeyStatus === 'error' ? 'text-red-400' :
            'text-yellow-400'
          }`}>
            {apiKeyStatus === 'configured' ? 'AI System Ready' :
             apiKeyStatus === 'missing' ? 'Demo Mode - AI Processing Unavailable' :
             apiKeyStatus === 'error' ? 'AI Connection Error' :
             isTestingConnection ? 'Testing AI Connection...' : 'Checking AI Status...'}
          </h3>
        </div>
        
        {apiKeyStatus === 'configured' && (
          <p className="mt-2 text-sm text-gray-400">
            NeuroClaim AI is ready to process insurance claims with advanced fraud detection.
          </p>
        )}
      </div>

      {/* Sample Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Try Sample Claims</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleDocuments.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSampleDocument(sample)}
              className="p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-cyan-500/50 rounded-lg text-left transition-all duration-200 group"
            >
              <FileText className="w-6 h-6 text-cyan-400 mb-2" />
              <h4 className="font-medium text-gray-100 group-hover:text-cyan-400 transition-colors">
                {sample.title}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                Click to load this sample claim
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Document Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Claim Document</h3>
        
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.json,.xml,.csv"
          />
          
          <div className="text-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              dragActive ? 'text-cyan-400' : 'text-gray-400'
            }`} />
            <p className="text-gray-300 font-medium mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-400">
              Supported: PDF, Word, Images, Text, JSON, XML, CSV
            </p>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Or paste your claim document text here..."
          className="w-full h-64 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-none"
        />
      </div>

      {/* Process Button */}
      <button
        onClick={processDocument}
        disabled={processing || (!documentText.trim() && uploadedFiles.length === 0) || apiKeyStatus === 'error'}
        className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 ${
          processing || (!documentText.trim() && uploadedFiles.length === 0) || apiKeyStatus === 'error'
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : apiKeyStatus === 'configured'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25'
            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 hover:from-gray-500 hover:to-gray-600'
        } group flex items-center justify-center gap-3`}
      >
        {processing ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            Processing with AI...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            {apiKeyStatus === 'configured' ? 'Process Claim with NeuroClaim AI' : 'Try Demo Interface (AI Processing Requires API Key)'}
          </>
        )}
      </button>

      {/* Results Section */}
      {currentResult && (
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8 transform transition-all duration-500 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">
              AI Analysis Results
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extracted Information */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Extracted Information
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Claim Number', value: currentResult.extractedData?.claimNumber || 'Not found' },
                  { label: 'Claimant', value: currentResult.extractedData?.claimantName || 'Not found' },
                  { label: 'Type', value: currentResult.extractedData?.claimType || 'Unknown' },
                  { label: 'Amount', value: currentResult.extractedData?.estimatedAmount ? formatCurrency(currentResult.extractedData.estimatedAmount) : 'Not specified' },
                  { label: 'Date', value: currentResult.extractedData?.dateOfIncident || 'Not found' },
                  { label: 'Confidence', value: currentResult.extractedData?.confidence || 'Unknown' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-400">{item.label}:</span>
                    <span className="font-medium text-gray-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Assessment */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Fraud Assessment
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level:</span>
                  <Badge variant={
                    currentResult.fraudAssessment?.riskLevel === 'low' ? 'success' :
                    currentResult.fraudAssessment?.riskLevel === 'medium' ? 'warning' :
                    currentResult.fraudAssessment?.riskLevel === 'high' ? 'danger' : 'secondary'
                  }>
                    {currentResult.fraudAssessment?.riskLevel || 'Unknown'} Risk
                  </Badge>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Fraud Score:</span>
                    <span className="font-bold text-xl text-gray-100">
                      {((currentResult.fraudAssessment?.fraudScore || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        (currentResult.fraudAssessment?.fraudScore || 0) < 0.3 ? 'bg-green-500' :
                        (currentResult.fraudAssessment?.fraudScore || 0) < 0.7 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(currentResult.fraudAssessment?.fraudScore || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {currentResult.fraudAssessment?.redFlags && currentResult.fraudAssessment.redFlags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-2">Red Flags:</p>
                    <ul className="space-y-1 text-xs text-gray-300">
                      {currentResult.fraudAssessment.redFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Processing Recommendations */}
          {currentResult.categorization?.processingRecommendations && (
            <div className="mt-6 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Recommendations
              </h3>
              <ul className="space-y-2">
                {currentResult.categorization.processingRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="p-1 bg-blue-500/20 rounded">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderClaimsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Processed Claims History</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAllClaims([]);
            setAnalytics(null);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear History
        </Button>
      </div>

      {allClaims.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No claims processed yet</p>
          <p className="text-sm text-gray-500 mt-2">Process a claim to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allClaims.map((claim) => (
            <div 
              key={claim.id} 
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-100">
                    {claim.extractedData?.claimNumber || `Claim #${claim.id.slice(0, 8)}`}
                  </h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {claim.extractedData?.claimantName || 'Unknown Claimant'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-100">
                    {formatCurrency(claim.extractedData?.estimatedAmount || 0)}
                  </p>
                  <Badge variant={
                    claim.fraudAssessment?.riskLevel === 'low' ? 'success' :
                    claim.fraudAssessment?.riskLevel === 'medium' ? 'warning' :
                    'danger'
                  }>
                    {claim.fraudAssessment?.riskLevel || 'Unknown'} Risk
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium text-gray-300 capitalize">
                    {claim.extractedData?.claimType || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium text-gray-300">
                    {claim.status || 'Processed'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Fraud Score</p>
                  <p className="font-medium text-gray-300">
                    {((claim.fraudAssessment?.fraudScore || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Processing Time</p>
                  <p className="font-medium text-gray-300">
                    {claim.processingTimeMs ? `${(claim.processingTimeMs / 1000).toFixed(1)}s` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-100">
                Claim Details: {selectedClaim.extractedData?.claimNumber || 'Unknown'}
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Full claim details here */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-400">Extracted Data</h3>
                  <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedClaim.extractedData, null, 2)}
                  </pre>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-400">Fraud Assessment</h3>
                  <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedClaim.fraudAssessment, null, 2)}
                  </pre>
                </div>
              </div>
              
              {selectedClaim.validation && (
                <div>
                  <h3 className="font-semibold text-cyan-400 mb-2">Validation Results</h3>
                  <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedClaim.validation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-100">Processing Analytics</h3>
      
      {!analytics || allClaims.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No analytics data available</p>
          <p className="text-sm text-gray-500 mt-2">Process some claims to see analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Summary Stats */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Claims</p>
              <p className="text-2xl font-bold text-gray-100">{analytics.totalClaims}</p>
            </CardBody>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(analytics.totalAmount)}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Average Fraud Score</p>
              <p className="text-2xl font-bold text-gray-100">
                {(analytics.averageFraudScore * 100).toFixed(0)}%
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-100">
                {(analytics.averageProcessingTime / 1000).toFixed(1)}s
              </p>
            </CardBody>
          </Card>

          {/* Type Distribution */}
          <div className="md:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h4 className="font-semibold text-gray-100 mb-4">Claims by Type</h4>
            <div className="space-y-3">
              {Object.entries(analytics.typeDistribution).map(([type, data]) => (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300 capitalize">{type}</span>
                    <span className="text-sm text-gray-400">{data.count} claims</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{ width: `${(data.count / analytics.totalClaims) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="md:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h4 className="font-semibold text-gray-100 mb-4">Risk Level Distribution</h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(analytics.riskLevelDistribution).map(([level, count]) => (
                <div key={level} className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    level === 'low' ? 'text-green-400' :
                    level === 'medium' ? 'text-yellow-400' :
                    level === 'high' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {count}
                  </div>
                  <p className="text-sm text-gray-400 capitalize">{level} Risk</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />
    } else if (file.type === 'application/pdf') {
      return <File className="w-5 h-5 text-red-400" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">NeuroClaim AI Demo</h1>
              <p className="text-gray-400">Advanced insurance claim processing with fraud detection</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'process', label: 'Process Claim', icon: FileText },
            { id: 'claims', label: 'Claims History', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoaded && renderContent()}
      </div>
    </div>
  );
};

export default ClaimsProcessingDemo;