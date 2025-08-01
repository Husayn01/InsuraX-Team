import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Brain, Zap, CheckCircle, 
  AlertCircle, TrendingUp, Clock, DollarSign,
  Shield, Activity, BarChart3, X, Loader2,
  File, Image, FileCheck, AlertTriangle,
  ChevronDown, ChevronUp, Download, RefreshCw,
  Sparkles, Database, Code, ArrowRight,
  Info, FileImage, FileType, Bot, Car, Heart, Home,
  Hash, User, Tag, Calendar, MapPin
} from 'lucide-react';
import { NairaIcon } from '@shared/components'
import { Alert, Button, Badge, Card, CardBody, LoadingSpinner } from '@shared/components';
import { geminiClient } from '../utils/geminiClient';
import { ClaimsProcessingSystem} from '../services/claimsOrchestrator';
import { GEMINI_CONFIG } from '../config/gemini';

export const ClaimsProcessing = () => {
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
  const [expandedSections, setExpandedSections] = useState({
    extraction: true,
    fraud: true,
    validation: true,
    categorization: true,
    summary: true
  });

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
      icon: <Car className="w-5 h-5" />,
      type: 'auto',
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
      icon: <Heart className="w-5 h-5" />,
      type: 'health',
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
      icon: <Home className="w-5 h-5" />,
      type: 'property',
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
      setTimeout(() => setErrorMessage(''), 5000);
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

      if (result.status === 'completed') {
        setCurrentResult(result);
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
      alert('Some files were not supported. Supported types: ' + enhancedSystem.supportedFileTypes.join(', '));
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const getFileIcon = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      return <FileImage className="w-5 h-5 text-cyan-400" />;
    } else if (extension === 'pdf') {
      return <FileType className="w-5 h-5 text-red-400" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    } else {
      return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderProcessTab = () => (
    <div className="space-y-8">
      {/* API Status Banner */}
      {apiKeyStatus !== 'configured' && (
        <Alert 
          type="warning" 
          title="Demo Mode Active"
          className="bg-amber-900/20 border-amber-500/50 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-200">
                {apiKeyStatus === 'missing' 
                  ? 'Gemini API key not configured. You can explore the interface, but AI processing requires an API key.'
                  : 'API connection error. Please check your configuration.'}
              </p>
              <p className="text-sm text-amber-300/70 mt-1">
                Set VITE_GEMINI_API_KEY in your environment variables to enable full functionality.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert 
          type="error" 
          title="Error"
          className="bg-red-900/20 border-red-500/50 backdrop-blur-sm animate-shake"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        </Alert>
      )}

      {/* Sample Documents */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Sample Documents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleDocuments.map((sample, index) => {
            const colors = ['cyan', 'purple', 'emerald'];
            const color = colors[index % colors.length];
            
            return (
              <button
                key={index}
                onClick={() => loadSampleDocument(sample)}
                className={`
                  relative group p-6 bg-gray-800/50 hover:bg-gray-700/50 
                  border border-gray-700/50 hover:border-${color}-500/50 
                  rounded-xl transition-all duration-300 text-left
                  hover:shadow-lg hover:shadow-${color}-500/10
                  hover:transform hover:scale-105 overflow-hidden
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex p-3 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 rounded-xl mb-4`}>
                    {sample.icon || <FileText className="w-6 h-6 text-${color}-400" />}
                  </div>
                  <h4 className="font-semibold text-white mb-2">{sample.title}</h4>
                  <p className="text-sm text-gray-400">Click to load this sample claim document</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Claim Document Text
            </h3>
          </div>
          <CardBody className="p-6">
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste your claim document text here..."
              className="w-full h-64 px-4 py-3 bg-gray-700/50 text-gray-100 placeholder-gray-500 
                       border border-gray-600 rounded-xl focus:outline-none focus:border-cyan-500/50 
                       focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 resize-none
                       scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {documentText.length} characters
              </span>
              {documentText.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentText('')}
                  className="text-gray-400 hover:text-red-400"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* File Upload */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Upload Documents
            </h3>
          </div>
          <CardBody className="p-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                ${dragActive 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700/30 hover:bg-gray-700/50'
                }
              `}
            >
              <input
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
                accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.json,.xml,.csv"
              />
              
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className={`
                    p-4 rounded-full mb-4 transition-all duration-300
                    ${dragActive 
                      ? 'bg-cyan-500/20 scale-110' 
                      : 'bg-purple-500/20 hover:bg-purple-500/30'
                    }
                  `}>
                    <Upload className={`w-8 h-8 ${dragActive ? 'text-cyan-400' : 'text-purple-400'}`} />
                  </div>
                  <p className="text-white font-medium mb-2">
                    {dragActive ? 'Drop files here' : 'Drop files or click to browse'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports: Images, PDFs, Word docs, Text files
                  </p>
                </div>
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600 group hover:border-gray-500 transition-all">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={processDocument}
          disabled={processing || apiKeyStatus !== 'configured'}
          size="lg"
          className={`
            relative px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300
            ${processing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : apiKeyStatus === 'configured'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            group overflow-hidden
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          {processing ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <span>Processing with AI...</span>
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6" />
              <span>{apiKeyStatus === 'configured' ? 'Process with NeuroClaim AI' : 'Demo Mode - Configure API Key'}</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </div>

      {/* Results Section */}
      {currentResult && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              AI Analysis Complete
            </h2>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              Processing Time: {(currentResult.processingTime / 1000).toFixed(1)}s
            </Badge>
          </div>

          {/* Results Cards */}
          <div className="space-y-6">
            {/* Extracted Information */}
            <Card className={`bg-gray-800/50 backdrop-blur-sm border-gray-700/50 transition-all duration-300 ${expandedSections.extraction ? 'hover:shadow-xl' : ''}`}>
              <div 
                className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 cursor-pointer"
                onClick={() => toggleSection('extraction')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    Extracted Information
                  </h3>
                  {expandedSections.extraction ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
              {expandedSections.extraction && (
                <CardBody className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Claim Number', value: currentResult.claimData?.claimNumber || 'Not found', icon: Hash },
                      { label: 'Claimant', value: currentResult.claimData?.claimantName || 'Not found', icon: User },
                      { label: 'Type', value: currentResult.claimData?.claimType || 'Unknown', icon: Tag },
                      { label: 'Amount', value: formatCurrency(currentResult.claimData?.estimatedAmount || 0), icon: NairaIcon },
                      { label: 'Date of Incident', value: currentResult.claimData?.dateOfIncident || 'Not found', icon: Calendar },
                      { label: 'Location', value: currentResult.claimData?.incidentLocation || 'Not found', icon: MapPin }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className="p-2 bg-gray-600/50 rounded-lg">
                          <item.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400">{item.label}</p>
                          <p className="font-medium text-white">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {currentResult.claimData?.confidence && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-400">
                        Extraction Confidence: <span className="font-semibold capitalize">{currentResult.claimData.confidence}</span>
                      </p>
                    </div>
                  )}
                </CardBody>
              )}
            </Card>

            {/* Fraud Assessment */}
            <Card className={`bg-gray-800/50 backdrop-blur-sm border-gray-700/50 transition-all duration-300 ${expandedSections.fraud ? 'hover:shadow-xl' : ''}`}>
              <div 
                className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 cursor-pointer"
                onClick={() => toggleSection('fraud')}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    Fraud Risk Assessment
                  </h3>
                  {expandedSections.fraud ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
              {expandedSections.fraud && currentResult.fraudAssessment && (
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold capitalize ${
                          currentResult.fraudAssessment.riskLevel === 'low' ? 'text-green-400' :
                          currentResult.fraudAssessment.riskLevel === 'medium' ? 'text-yellow-400' :
                          currentResult.fraudAssessment.riskLevel === 'high' ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {currentResult.fraudAssessment.riskLevel}
                        </span>
                        <Badge className={`
                          ${currentResult.fraudAssessment.riskLevel === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          currentResult.fraudAssessment.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          currentResult.fraudAssessment.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'}
                        `}>
                          Score: {currentResult.fraudAssessment.riskScore}/100
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">Confidence</p>
                      <p className="text-lg font-semibold text-white capitalize">{currentResult.fraudAssessment.confidence}</p>
                    </div>
                  </div>

                  {/* Risk Indicators */}
                  {currentResult.fraudAssessment.fraudIndicators?.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Risk Indicators</h4>
                      <div className="space-y-2">
                        {currentResult.fraudAssessment.fraudIndicators.map((indicator, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-300">{indicator.indicator}</p>
                              <p className="text-xs text-red-400/70 mt-1">{indicator.explanation}</p>
                            </div>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              {indicator.weight}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {currentResult.fraudAssessment.recommendedActions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Recommended Actions</h4>
                      <div className="space-y-2">
                        {currentResult.fraudAssessment.recommendedActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-cyan-400" />
                            <p className="text-sm text-gray-200">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              )}
            </Card>

            {/* Summary & Next Steps */}
            {currentResult.summary && (
              <Card className={`bg-gray-800/50 backdrop-blur-sm border-gray-700/50 transition-all duration-300 ${expandedSections.summary ? 'hover:shadow-xl' : ''}`}>
                <div 
                  className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-800/30 cursor-pointer"
                  onClick={() => toggleSection('summary')}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <FileCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      Executive Summary
                    </h3>
                    {expandedSections.summary ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                {expandedSections.summary && (
                  <CardBody className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed">{currentResult.summary.executiveSummary}</p>
                      
                      {currentResult.summary.timeline && (
                        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <p className="text-sm text-purple-300">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Expected Timeline: {currentResult.summary.timeline}
                          </p>
                        </div>
                      )}

                      {currentResult.actionPlan?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold text-white mb-4">Action Plan</h4>
                          <div className="space-y-3">
                            {currentResult.actionPlan.map((action, index) => (
                              <div key={index} className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className={`p-2 rounded-lg ${
                                  action.priority === 'urgent' ? 'bg-red-500/20' :
                                  action.priority === 'high' ? 'bg-orange-500/20' :
                                  'bg-blue-500/20'
                                }`}>
                                  <Zap className={`w-4 h-4 ${
                                    action.priority === 'urgent' ? 'text-red-400' :
                                    action.priority === 'high' ? 'text-orange-400' :
                                    'text-blue-400'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-white">{action.action}</p>
                                    <Badge className={`text-xs ${
                                      action.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                      action.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    }`}>
                                      {action.priority}
                                    </Badge>
                                  </div>
                                  <ul className="text-sm text-gray-400 space-y-1">
                                    {action.details?.map((detail, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-gray-500 mt-0.5">•</span>
                                        <span>{detail}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardBody>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      {allClaims.length === 0 ? (
        <div className="text-center py-16">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20"></div>
            <div className="relative p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
              <Database className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-300 mb-2">No claims processed yet</h3>
          <p className="text-gray-500">Process your first claim to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Processing History</h3>
            <Badge className="bg-gray-700 text-gray-300 border-gray-600">
              {allClaims.length} claims
            </Badge>
          </div>

          {allClaims.map((claim, index) => (
            <Card 
              key={claim.processingId} 
              className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`
                        ${claim.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}
                      `}>
                        {claim.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {claim.status}
                      </Badge>
                      
                      <Badge className={`
                        ${claim.fraudAssessment?.riskLevel === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        claim.fraudAssessment?.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        claim.fraudAssessment?.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'}
                      `}>
                        <Shield className="w-3 h-3 mr-1" />
                        {claim.fraudAssessment?.riskLevel || 'unknown'} risk
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold text-white text-lg mb-1">
                      {claim.claimData?.claimNumber || claim.processingId}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {claim.claimData?.claimantName || 'Unknown'} • 
                      {claim.claimData?.claimType || 'Unknown type'} • 
                      {formatCurrency(claim.claimData?.estimatedAmount || 0)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(claim.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {claim.processingTimeMs ? `${(claim.processingTimeMs / 1000).toFixed(1)}s` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Claim Details: {selectedClaim.claimData?.claimNumber || 'Unknown'}
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-88px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-cyan-400 mb-3">Extracted Data</h3>
                  <pre className="bg-gray-900/50 p-4 rounded-xl text-xs text-gray-300 overflow-x-auto border border-gray-700">
                    {JSON.stringify(selectedClaim.claimData, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold text-red-400 mb-3">Fraud Assessment</h3>
                  <pre className="bg-gray-900/50 p-4 rounded-xl text-xs text-gray-300 overflow-x-auto border border-gray-700">
                    {JSON.stringify(selectedClaim.fraudAssessment, null, 2)}
                  </pre>
                </div>
              </div>
              
              {selectedClaim.validation && (
                <div>
                  <h3 className="font-semibold text-blue-400 mb-3">Validation Results</h3>
                  <pre className="bg-gray-900/50 p-4 rounded-xl text-xs text-gray-300 overflow-x-auto border border-gray-700">
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

  const renderAnalyticsTab = () => {
    // Calculate additional analytics
    const totalAmount = allClaims.reduce((sum, claim) => 
      sum + (claim.claimData?.estimatedAmount || 0), 0
    );
    
    const averageFraudScore = allClaims.length > 0
      ? allClaims.reduce((sum, claim) => 
          sum + (claim.fraudAssessment?.riskScore || 0), 0
        ) / allClaims.length / 100
      : 0;

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6">Processing Analytics</h3>
        
        {!analytics || allClaims.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20"></div>
              <div className="relative p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30">
                <BarChart3 className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No analytics data available</h3>
            <p className="text-gray-500">Process some claims to see analytics</p>
          </div>
        ) : (
          <div>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: "Total Claims",
                  value: analytics.totalClaims,
                  icon: FileText,
                  gradient: 'from-blue-500 to-cyan-500',
                  bgPattern: 'from-blue-500/10 to-cyan-500/10'
                },
                {
                  title: "Total Amount",
                  value: formatCurrency(totalAmount),
                  icon: DollarSign,
                  gradient: 'from-emerald-500 to-green-500',
                  bgPattern: 'from-emerald-500/10 to-green-500/10'
                },
                {
                  title: "Average Fraud Score",
                  value: `${(averageFraudScore * 100).toFixed(0)}%`,
                  icon: Shield,
                  gradient: 'from-red-500 to-pink-500',
                  bgPattern: 'from-red-500/10 to-pink-500/10'
                },
                {
                  title: "Avg Processing",
                  value: `${(analytics.averageProcessingTime / 1000).toFixed(1)}s`,
                  icon: Clock,
                  gradient: 'from-purple-500 to-pink-500',
                  bgPattern: 'from-purple-500/10 to-pink-500/10'
                }
              ].map((stat, index) => (
                <Card key={index} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgPattern} opacity-50`}></div>
                  <CardBody className="relative">
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Distribution */}
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <h4 className="font-semibold text-white">Risk Level Distribution</h4>
                </div>
                <CardBody className="p-6">
                  <div className="space-y-4">
                    {Object.entries(analytics.riskDistribution || {}).map(([level, count]) => {
                      const percentage = (count / analytics.totalClaims) * 100;
                      const colors = {
                        low: 'from-green-500 to-emerald-500',
                        medium: 'from-yellow-500 to-amber-500',
                        high: 'from-orange-500 to-red-500',
                        critical: 'from-red-500 to-pink-500',
                        unknown: 'from-gray-500 to-gray-600'
                      };
                      
                      return (
                        <div key={level} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-300 capitalize">{level}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{count} claims</span>
                              <span className="text-sm font-semibold text-white">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[level] || colors.unknown} rounded-full transition-all duration-1000`}
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Claim Type Distribution */}
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <h4 className="font-semibold text-white">Claim Type Distribution</h4>
                </div>
                <CardBody className="p-6">
                  <div className="space-y-4">
                    {Object.entries(analytics.claimTypeDistribution || {}).map(([type, count]) => {
                      const percentage = (count / analytics.totalClaims) * 100;
                      const colors = [
                        'from-blue-500 to-cyan-500',
                        'from-purple-500 to-pink-500',
                        'from-emerald-500 to-green-500',
                        'from-amber-500 to-orange-500'
                      ];
                      const colorIndex = Object.keys(analytics.claimTypeDistribution).indexOf(type);
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-300 capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{count}</span>
                              <span className="text-sm font-semibold text-white">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[colorIndex % colors.length]} rounded-full transition-all duration-1000`}
                              style={{ width: `${percentage}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px] animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            NeuroClaim AI
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the power of AI-driven insurance claim processing with advanced fraud detection
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Real-time Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Powered by Gemini AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-400">Advanced Fraud Detection</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700">
            {[
              { id: 'process', label: 'Process Claim', icon: Zap },
              { id: 'history', label: 'History', icon: Clock },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }
                `}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                )}
                <tab.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'process' && renderProcessTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>
      </div>

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 3px;
        }
        .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background-color: #1F2937;
        }
      `}</style>
    </div>
  );
};

export default ClaimsProcessing;