// components/ClaimsProcessingDemo.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Upload,
  BarChart3,
  RefreshCw,
  Eye,
  Brain,
  Zap,
  TrendingUp,
  Activity,
  File,
  X,
  Paperclip
} from 'lucide-react';

// Import services
import { GEMINI_CONFIG } from '../config/gemini.js'
import { ClaimsProcessingSystem } from '../services/claimsOrchestrator.js';
import { geminiClient } from '../utils/geminiClient.js';

// Create system instance
const enhancedSystem = new ClaimsProcessingSystem();

const EnhancedClaimsProcessingDemo = () => {
  const [activeTab, setActiveTab] = useState('process');
  const [documentText, setDocumentText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [allClaims, setAllClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Check API key status and test connection
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        setApiKeyStatus('checking');
        const hasApiKey = !!GEMINI_CONFIG.apiKey && GEMINI_CONFIG.apiKey.includes('AI');
        
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
Name: John Smith
Address: 123 Main Street, Anytown, CA 90210
Phone: (555) 123-4567

Incident Details:
I was stopped at a red light on Oak Avenue when the vehicle behind me failed to stop and rear-ended my car. The impact pushed my vehicle forward into the intersection. The other driver admitted they were distracted and didn't see the red light in time.

Vehicle Information:
Make: Toyota
Model: Camry
Year: 2020
License Plate: ABC123

Damage Description:
- Rear bumper completely crushed
- Trunk won't close properly
- Rear lights broken
- Possible frame damage

Estimated Repair Cost: $8,500

Witness Information:
Sarah Johnson witnessed the accident from the sidewalk. Phone: (555) 987-6543

Medical Treatment:
Went to ER for neck pain. X-rays negative. Prescribed muscle relaxants.`
    },
    {
      title: "Health Insurance Claim - Surgery",
      content: `HEALTH INSURANCE CLAIM FORM

Claim Number: HC-2024-005678
Policy Number: HEALTH-456789
Patient Name: Mary Johnson
Date of Service: February 28, 2024

Provider Information:
Hospital: City General Hospital
Doctor: Dr. Robert Brown, MD
Provider ID: PRV-123456

Procedure Details:
Diagnosis: Acute Appendicitis
Procedure: Laparoscopic Appendectomy
CPT Code: 44970

Itemized Charges:
- Surgery: $12,000
- Anesthesia: $2,500
- Hospital Room (2 days): $3,000
- Medications: $500
- Lab Tests: $800

Total Charges: $18,800

Insurance Information:
Primary Insurance: Your Health Plan
Group Number: GRP-789
Deductible Met: $1,500 of $2,000

Pre-Authorization: Obtained on February 27, 2024
Auth Number: AUTH-2024-9876`
    },
    {
      title: "Property Claim - Water Damage",
      content: `PROPERTY DAMAGE CLAIM

Claim Number: PROP-2024-009876
Policy Number: HOME-321654
Date of Loss: January 10, 2024

Policyholder: Robert Williams
Property Address: 456 Elm Street, Springfield, IL 62701

Description of Loss:
During the recent cold snap, a pipe burst in the upstairs bathroom while we were away for the weekend. Water ran for approximately 48 hours before we discovered it. 

Affected Areas:
- Master bedroom ceiling and walls
- Hallway flooring
- Kitchen ceiling (below bathroom)
- Various personal belongings

Immediate Actions Taken:
- Shut off main water valve
- Called emergency water extraction service
- Moved undamaged belongings to garage
- Took extensive photos of damage

Estimated Damages:
- Water extraction and drying: $3,500
- Ceiling repairs: $2,800
- Flooring replacement: $4,200
- Drywall and painting: $3,000
- Personal property: $2,000

Total Estimate: $15,500

Contractor: Springfield Restoration Services
Contact: (555) 246-8135`
    }
  ];

  const processDocument = async () => {
    if (!documentText.trim() && uploadedFiles.length === 0) {
      alert('Please enter claim text or upload a document');
      return;
    }

    setProcessing(true);
    setCurrentResult(null);

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
        additionalContext: 'Demo processing with enhanced features'
      });

      setCurrentResult(result);
      
      if (result.status === 'completed') {
        const claims = enhancedSystem.getAllClaims();
        setAllClaims(claims);
        updateAnalytics();
      }
    } catch (error) {
      console.error('Processing error:', error);
      setCurrentResult({
        status: 'failed',
        error: error.message
      });
    }

    setProcessing(false);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
            Connection Status: {apiKeyStatus === 'checking' ? 'Checking...' : 
                               apiKeyStatus === 'configured' ? 'Connected' :
                               apiKeyStatus === 'missing' ? 'Demo Mode' :
                               'Connection Error'}
          </h3>
          
          {isTestingConnection && <div className="ml-2 w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>}
        </div>
        
        {apiKeyStatus === 'missing' && (
          <div className="mt-2">
            <p className="text-blue-300 mb-2 text-sm">
              🚀 <strong>Live Demo Mode:</strong> You can explore the interface and see how it works.
            </p>
            <p className="text-blue-400 text-sm">
              💡 <strong>For Full AI Processing:</strong> Clone the repo and add your Gemini API key locally.
            </p>
          </div>
        )}
        
        {apiKeyStatus === 'configured' && (
          <p className="text-green-400 mt-2 text-sm">
            ✅ Successfully connected to Google Gemini Pro API. Ready for AI-powered claim processing!
          </p>
        )}
      </div>

      {/* Sample Documents */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Sample Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleDocuments.map((sample, index) => (
            <button
              key={index}
              onClick={() => loadSampleDocument(sample)}
              className="text-left p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-cyan-500 hover:bg-gray-700 transition-all duration-300 group"
            >
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

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
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
            dragActive ? 'text-cyan-400' : 'text-gray-500'
          }`} />
          <p className="text-gray-300 font-medium mb-2">
            Drag & drop claim documents here
          </p>
          <p className="text-gray-500 text-sm">
            or click to browse files
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Supported: {enhancedSystem.supportedFileTypes.join(', ')}
          </p>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Input */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Claim Document Text
        </h3>
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Paste claim document text here or use sample documents above..."
          className="w-full h-64 p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/25 transition-all duration-300 resize-none"
        />
        <p className="text-sm text-gray-500 mt-2">
          {documentText.length} characters | {uploadedFiles.length} files attached
        </p>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={processDocument}
          disabled={processing || (!documentText.trim() && uploadedFiles.length === 0)}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
            processing 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : apiKeyStatus === 'configured'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 hover:from-gray-500 hover:to-gray-600'
          } group flex items-center gap-3`}
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
      </div>

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
                  { label: 'Amount', value: currentResult.extractedData?.estimatedAmount ? formatCurrency(currentResult.extractedData.estimatedAmount) : 'Not specified' }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">{label}:</span>
                    <span className="text-gray-100 font-semibold">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-400">Confidence:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    currentResult.extractedData?.confidence === 'high' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : currentResult.extractedData?.confidence === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {currentResult.extractedData?.confidence || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fraud Assessment */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Fraud Risk Assessment
              </h3>
              <div className="space-y-4">
                {currentResult.fraudAssessment && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-medium">Risk Level:</span>
                      <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
                        currentResult.fraudAssessment.riskLevel === 'low' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : currentResult.fraudAssessment.riskLevel === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : currentResult.fraudAssessment.riskLevel === 'high'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {currentResult.fraudAssessment.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentResult.fraudAssessment.riskLevel === 'low' 
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : currentResult.fraudAssessment.riskLevel === 'medium'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                            : currentResult.fraudAssessment.riskLevel === 'high'
                            ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${currentResult.fraudAssessment.riskScore || 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      {currentResult.fraudAssessment.overallAssessment || 'No assessment available'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {currentResult.summary && (
            <div className="mt-6 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-cyan-400 mb-3">Executive Summary</h3>
              <p className="text-gray-300 leading-relaxed">
                {currentResult.summary.executiveSummary}
              </p>
            </div>
          )}

          {/* Action Plan */}
          {currentResult.actionPlan && currentResult.actionPlan.length > 0 && (
            <div className="mt-6 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-cyan-400 mb-4">Recommended Actions</h3>
              <div className="space-y-3">
                {currentResult.actionPlan.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      action.priority === 'urgent' ? 'bg-red-400' :
                      action.priority === 'high' ? 'bg-orange-400' :
                      'bg-green-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-100 font-medium">{action.action}</p>
                      {action.details && (
                        <p className="text-sm text-gray-400 mt-1">
                          {Array.isArray(action.details) ? action.details.join(', ') : action.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderClaimsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Processed Claims</h2>
        <button
          onClick={() => {
            enhancedSystem.clearAllClaims();
            setAllClaims([]);
            setCurrentResult(null);
            updateAnalytics();
          }}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Clear All Claims
        </button>
      </div>

      {allClaims.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No claims processed yet</p>
          <p className="text-gray-500 text-sm mt-2">Process a claim to see it here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {allClaims.map((claim) => (
            <div
              key={claim.processingId}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-100">
                    {claim.extractedData?.claimNumber || 'Unknown Claim'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {claim.extractedData?.claimantName || 'Unknown Claimant'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    claim.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {claim.status === 'completed' ? 'Processed' : 'Failed'}
                  </span>
                  {claim.fraudAssessment && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      claim.fraudAssessment.riskLevel === 'low' 
                        ? 'bg-green-500/20 text-green-400'
                        : claim.fraudAssessment.riskLevel === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {claim.fraudAssessment.riskLevel?.toUpperCase()} RISK
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="text-gray-300 font-medium">
                    {claim.extractedData?.claimType || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="text-gray-300 font-medium">
                    {formatCurrency(claim.extractedData?.estimatedAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Processing Time</p>
                  <p className="text-gray-300 font-medium">
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
              
              {selectedClaim.customerResponse && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-cyan-400">Customer Response</h3>
                  <div className="bg-gray-900 p-4 rounded-lg text-gray-300">
                    {selectedClaim.customerResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => {
    if (!analytics || analytics.totalClaims === 0) {
      return (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No analytics data available</p>
          <p className="text-gray-500 text-sm mt-2">Process some claims to see analytics</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Total Claims</p>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-gray-100">{analytics.totalClaims}</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Success Rate</p>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-gray-100">
              {((analytics.successfullyProcessed / analytics.totalClaims) * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">Avg Processing</p>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-gray-100">
              {(analytics.averageProcessingTime / 1000).toFixed(1)}s
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">High Risk</p>
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-gray-100">
              {analytics.riskDistribution.high || 0}
            </p>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-semibold text-gray-100 mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analytics.riskDistribution).map(([level, count]) => (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{level}</span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full ${
                        level === 'low' ? 'bg-green-500' :
                        level === 'medium' ? 'bg-yellow-500' :
                        level === 'high' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(count / analytics.totalClaims) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim Type Distribution */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-semibold text-gray-100 mb-4">Claim Types</h3>
            <div className="space-y-3">
              {Object.entries(analytics.claimTypeDistribution).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-gray-300">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${(count / analytics.totalClaims) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8 transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`text-center mb-8 transform transition-all duration-700 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                NeuroClaim
              </h1>
              <p className="text-gray-400 text-lg">
                AI-powered document processing with Google Gemini Pro integration and real-time analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Gemini Pro Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Advanced Fraud Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Real AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Multi-format Support</span>
            </div>
            {apiKeyStatus === 'configured' ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>AI Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-400">
                <AlertCircle className="w-4 h-4" />
                <span>Demo Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-700 mb-8 overflow-hidden">
          <nav className="flex">
            {[
              { id: 'process', label: 'Process Claims', icon: Upload, color: 'cyan' },
              { id: 'claims', label: 'Claims Dashboard', icon: FileText, color: 'blue' },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'purple' }
            ].map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 px-8 py-6 font-semibold transition-all duration-300 flex-1 ${
                  activeTab === id
                    ? `bg-${color}-500/20 text-${color}-400 border-b-2 border-${color}-400`
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedClaimsProcessingDemo;