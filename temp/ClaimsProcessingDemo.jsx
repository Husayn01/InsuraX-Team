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
import { OPENAI_CONFIG } from '../config/openai.js'
import { ClaimsProcessingSystem } from '../services/claimsOrchestrator.js';
import { openAIClient } from '../utils/apiClient.js';

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
        const hasApiKey = !!OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey.startsWith('sk-');
        
        if (!hasApiKey) {
          setApiKeyStatus('missing');
          setErrorMessage('OpenAI API key not found. For demo purposes, you can view the interface without AI processing.');
          return;
        }

        // Test the connection only if API key is available
        setIsTestingConnection(true);
        const testResult = await openAIClient.testConnection();
        
        if (testResult.success) {
          setApiKeyStatus('configured');
          setErrorMessage('');
        } else {
          setApiKeyStatus('error');
          setErrorMessage(`API Connection Failed: ${testResult.error}`);
        }
      } catch (error) {
        setApiKeyStatus('error');
        setErrorMessage(`Connection test failed: ${error.message}`);
      } finally {
        setIsTestingConnection(false);
      }
    };
    
    checkApiKey();
  }, []);

  // File upload handlers
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

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return enhancedSystem.supportedFileTypes.includes(extension);
    });

    if (validFiles.length !== fileArray.length) {
      setErrorMessage(`Some files were skipped. Supported formats: ${enhancedSystem.supportedFileTypes.join(', ')}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);

    // Process files automatically
    for (const file of validFiles) {
      try {
        const extractedText = await enhancedSystem.extractTextFromFile(file);
        const existingText = documentText;
        const separator = existingText ? '\n\n--- FILE SEPARATOR ---\n\n' : '';
        setDocumentText(prev => prev + separator + `FILE: ${file.name}\n\n${extractedText}`);
      } catch (error) {
        setErrorMessage(`Failed to process ${file.name}: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  };

  const removeFile = (indexToRemove) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setDocumentText('');
  };

  const processClaim = async () => {
    if (!documentText.trim()) {
      setErrorMessage('Please enter document text or upload files');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (apiKeyStatus !== 'configured') {
      setErrorMessage('This is a demo version. To use AI processing, please run locally with your OpenAI API key.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setProcessing(true);
    setCurrentResult(null);
    setErrorMessage('');

    try {
      console.log('Starting claim processing...');
      const result = await enhancedSystem.processClaimComplete(documentText, {
        generateCustomerResponse: true,
        customerFriendly: true
      });

      if (result.success) {
        setCurrentResult(result.result);
        refreshData();
        setErrorMessage('');
      } else {
        throw new Error(result.error || 'Processing failed with unknown error');
      }
    } catch (error) {
      console.error('Processing failed:', error);
      setErrorMessage(`Processing failed: ${error.message}`);
      setCurrentResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const refreshData = () => {
    try {
      const claims = enhancedSystem.getAllClaims();
      setAllClaims(claims);
      setAnalytics(enhancedSystem.generateAnalytics());
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setErrorMessage(`Failed to refresh data: ${error.message}`);
    }
  };

  // Sample documents
  const sampleDocuments = {
    auto: `AUTOMOBILE ACCIDENT CLAIM REPORT

Claim Number: CLM-2025-001234
Policy Number: AUTO-789456123
Date of Loss: June 15, 2025
Date Reported: June 18, 2025

INSURED INFORMATION:
Name: John Michael Doe
Address: 123 Main Street, Lagos, Nigeria
Phone: +234 801 234 5678
Policy Effective: January 1, 2025

VEHICLE INFORMATION:
Year: 2022
Make: Toyota
Model: Camry
License Plate: LAG-456-XY
VIN: 4T1BE46K87U123456

ACCIDENT DETAILS:
Date of Accident: June 15, 2025
Time: 2:30 PM
Location: Intersection of Victoria Island Road and Adeola Odeku Street, Lagos

DESCRIPTION OF ACCIDENT:
While proceeding through the intersection on a green light, the insured vehicle was struck on the passenger side by another vehicle that ran the red light. The impact caused significant damage to the passenger door, rear quarter panel, and wheel assembly. No injuries were reported at the scene.

ESTIMATED DAMAGE: ₦2,800,000 ($3,500 USD)

WITNESSES:
1. Mary Johnson - Phone: +234 802 345 6789
2. David Okafor - Phone: +234 803 456 7890

POLICE REPORT: Filed - Report #LPD-2025-0615-442

The other driver admitted fault at the scene and provided insurance information. Photos of the damage and accident scene have been taken and will be submitted separately.`,

    health: `MEDICAL CLAIM FORM

Claim Number: MED-2025-005678
Policy Number: HEALTH-456789012
Member ID: 123456789

PATIENT INFORMATION:
Name: Sarah Elizabeth Williams
Date of Birth: March 12, 1985
Address: 45 Adeniran Ogunsanya Street, Surulere, Lagos
Phone: +234 804 567 8901

PROVIDER INFORMATION:
Hospital: Lagos University Teaching Hospital (LUTH)
Address: Idi-Araba, Surulere, Lagos
Doctor: Dr. Adebayo Ogundimu
Specialty: Emergency Medicine

TREATMENT DETAILS:
Date of Service: June 16, 2025
Emergency Room Visit
Chief Complaint: Severe abdominal pain

DIAGNOSIS:
Acute appendicitis requiring emergency appendectomy

PROCEDURES PERFORMED:
1. Emergency appendectomy (laparoscopic)
2. General anesthesia
3. Post-operative monitoring (24 hours)

MEDICATIONS PRESCRIBED:
1. Antibiotics (7-day course)
2. Pain management medication
3. Anti-inflammatory drugs

TOTAL CHARGES: ₦850,000 ($1,062.50 USD)
- Emergency room fee: ₦150,000
- Surgeon fee: ₦300,000
- Anesthesia: ₦100,000
- Hospital stay: ₦200,000
- Medications: ₦100,000

This was a genuine medical emergency requiring immediate surgical intervention. All procedures were medically necessary and performed according to standard protocols.`,

    property: `PROPERTY DAMAGE CLAIM REPORT

Claim Number: PROP-2025-009876
Policy Number: HOME-123789456
Date of Loss: June 14, 2025

PROPERTY OWNER:
Name: Robert and Jennifer Thompson
Property Address: 12 Glover Road, Ikoyi, Lagos
Phone: +234 805 678 9012

INCIDENT TYPE: Storm Damage

DESCRIPTION OF DAMAGE:
On June 14, 2025, during a severe thunderstorm with high winds, a large tree in the neighbor's yard fell onto our property, causing the following damage:

1. ROOF DAMAGE:
   - Major damage to the northeast section of the roof
   - Multiple broken tiles and torn underlayment
   - Damaged gutters and downspouts
   - Water intrusion into the master bedroom and hallway

2. STRUCTURAL DAMAGE:
   - Cracked ceiling in master bedroom
   - Water damage to hardwood floors
   - Damaged electrical fixtures in affected rooms

3. PERSONAL PROPERTY:
   - Damaged furniture in master bedroom
   - Ruined electronics due to water damage
   - Destroyed personal belongings

IMMEDIATE ACTIONS TAKEN:
- Contacted emergency services
- Arranged for temporary roof covering
- Documented all damage with photographs
- Obtained estimates from contractors

ESTIMATED TOTAL DAMAGE: ₦4,200,000 ($5,250 USD)
- Roof repairs: ₦2,500,000
- Interior repairs: ₦1,200,000
- Personal property: ₦500,000

Weather conditions were extreme and unprecedented for the season. Multiple properties in the area experienced similar storm damage.`
  };

  const loadSampleDocument = (type) => {
    setDocumentText(sampleDocuments[type]);
    setErrorMessage('');
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-900/50 text-green-400 border border-green-500/50';
      case 'medium': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50';
      case 'high': return 'bg-red-900/50 text-red-400 border border-red-500/50';
      case 'critical': return 'bg-red-900/70 text-red-300 border border-red-400';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-900/50 text-red-400 border border-red-500/50';
      case 'high': return 'bg-orange-900/50 text-orange-400 border border-orange-500/50';
      case 'normal': return 'bg-blue-900/50 text-blue-400 border border-blue-500/50';
      case 'low': return 'bg-gray-700/50 text-gray-400 border border-gray-600';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600';
    }
  };

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, []);

  const renderProcessingTab = () => (
    <div className="space-y-8">
      {/* Error Message Display */}
      {errorMessage && (
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
              💡 <strong>For Full AI Processing:</strong> Clone the repo and add your OpenAI API key locally.
            </p>
          </div>
        )}
        
        {apiKeyStatus === 'configured' && (
          <p className="text-green-400 mt-2 text-sm">
            ✅ Successfully connected to OpenAI API. Ready for AI-powered claim processing!
          </p>
        )}
      </div>

      {/* File Upload Section */}
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            Document Upload & Processing
          </h2>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-gray-600 hover:border-cyan-400 hover:bg-gray-700/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={enhancedSystem.supportedFileTypes.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full">
              <Paperclip className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-100 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Supported formats: PDF, Word, Text, Images ({enhancedSystem.supportedFileTypes.join(', ')})
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-100">Uploaded Files ({uploadedFiles.length})</h3>
              <button
                onClick={clearAllFiles}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-100 truncate max-w-32">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Processing Section */}
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            AI Document Processing
          </h2>
          {apiKeyStatus === 'configured' && (
            <div className="ml-auto flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">AI Ready</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Claim Document Text
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="w-full h-64 p-4 bg-gray-700/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none text-gray-100 placeholder-gray-500"
              placeholder="Paste your claim document text here, upload files above, or load a sample document..."
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {[
              { type: 'auto', label: 'Auto Claim', color: 'from-cyan-500 to-blue-600', icon: '🚗' },
              { type: 'health', label: 'Health Claim', color: 'from-green-500 to-emerald-600', icon: '🏥' },
              { type: 'property', label: 'Property Claim', color: 'from-purple-500 to-pink-600', icon: '🏠' }
            ].map(({ type, label, color, icon }) => (
              <button
                key={type}
                onClick={() => loadSampleDocument(type)}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${color} text-white rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={processClaim}
            disabled={processing || !documentText.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-semibold text-lg shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group"
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
                      ? 'bg-green-900/50 text-green-400 border border-green-500/50' 
                      : currentResult.extractedData?.confidence === 'medium'
                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50'
                      : 'bg-red-900/50 text-red-400 border border-red-500/50'
                  }`}>
                    {currentResult.extractedData?.confidence || 'unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Fraud Assessment */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Fraud Assessment
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { 
                    label: 'Risk Level', 
                    value: (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(currentResult.fraudAssessment?.riskLevel)}`}>
                        {currentResult.fraudAssessment?.riskLevel}
                      </span>
                    ) 
                  },
                  { label: 'Risk Score', value: `${currentResult.fraudAssessment?.riskScore}/100` },
                  { label: 'Indicators', value: `${currentResult.fraudAssessment?.fraudIndicators?.length || 0} found` },
                  { label: 'Confidence', value: currentResult.fraudAssessment?.confidence }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">{label}:</span>
                    <span className="text-gray-100 font-semibold">{typeof value === 'string' ? value : value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorization */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Smart Categorization
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Department', value: currentResult.categorization?.routing?.department || 'General' },
                  { 
                    label: 'Priority', 
                    value: (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(currentResult.categorization?.priority?.level)}`}>
                        {currentResult.categorization?.priority?.level || 'normal'}
                      </span>
                    ) 
                  },
                  { label: 'Assignment', value: currentResult.categorization?.routing?.assignmentType || 'Standard' },
                  { label: 'Timeline', value: currentResult.categorization?.routing?.estimatedHandlingTime || 'Standard' }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">{label}:</span>
                    <span className="text-gray-100 font-semibold">{typeof value === 'string' ? value : value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
              <h3 className="font-bold text-green-400 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Executive Summary
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {currentResult.summary?.executiveSummary || 'Summary not available'}
              </p>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="mt-8">
            <h3 className="font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Recommended Actions
            </h3>
            <div className="space-y-3">
              {(currentResult.recommendedActions || []).map((action, index) => (
                <div key={index} className={`p-4 rounded-xl border-l-4 bg-gray-700/30 ${
                  action.priority === 'critical' ? 'border-red-500' :
                  action.priority === 'urgent' ? 'border-red-500' :
                  action.priority === 'high' ? 'border-orange-500' :
                  'border-cyan-500'
                } transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}>
                  <p className="font-semibold text-gray-100">{action.action}</p>
                  <p className="text-sm text-gray-400 mt-1">{Array.isArray(action.details) ? action.details.join(', ') : action.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClaimsTab = () => (
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">
              Claims Dashboard ({allClaims.length})
            </h2>
          </div>
          <button
            onClick={refreshData}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 flex items-center gap-2 font-medium shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Claim ID', 'Claimant', 'Type', 'Amount', 'Risk Level', 'Priority', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="text-left p-4 font-semibold text-gray-300 border-b border-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allClaims.map((claim) => (
                  <tr key={claim.processingId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200">
                    <td className="p-4 font-mono text-xs text-gray-400">
                      {claim.processingId.slice(-8)}
                    </td>
                    <td className="p-4 font-medium text-gray-100">{claim.extractedData?.claimantName || 'Unknown'}</td>
                    <td className="p-4">
                      <span className="capitalize px-3 py-1 bg-blue-900/50 text-blue-400 border border-blue-500/50 rounded-full text-xs font-medium">
                        {claim.extractedData?.claimType || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-100">
                      {claim.extractedData?.estimatedAmount ? formatCurrency(claim.extractedData.estimatedAmount) : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(claim.fraudAssessment?.riskLevel || 'unknown')}`}>
                        {claim.fraudAssessment?.riskLevel || 'unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(claim.categorization?.priority?.level || 'normal')}`}>
                        {claim.categorization?.priority?.level || 'normal'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900/50 text-green-400 border border-green-500/50">
                        {claim.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedClaim(claim)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:bg-gray-700/50 px-3 py-1 rounded-lg transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {allClaims.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-300 text-lg">No claims processed yet</p>
            <p className="text-gray-500 text-sm">Use the Process tab to submit your first claim</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">
            Analytics Dashboard
          </h2>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  title: 'Total Claims', 
                  value: analytics.totalClaims, 
                  icon: FileText, 
                  color: 'from-cyan-500 to-blue-600',
                  bgColor: 'bg-gray-700/50'
                },
                { 
                  title: 'Processed Successfully', 
                  value: analytics.successfullyProcessed, 
                  icon: CheckCircle, 
                  color: 'from-green-500 to-emerald-600',
                  bgColor: 'bg-gray-700/50'
                },
                { 
                  title: 'Avg Processing Time', 
                  value: `${(analytics.averageProcessingTime / 1000).toFixed(1)}s`, 
                  icon: Clock, 
                  color: 'from-yellow-500 to-amber-600',
                  bgColor: 'bg-gray-700/50'
                },
                { 
                  title: 'High Risk Claims', 
                  value: analytics.riskDistribution.high || 0, 
                  icon: AlertCircle, 
                  color: 'from-red-500 to-pink-600',
                  bgColor: 'bg-gray-700/50'
                }
              ].map(({ title, value, icon: Icon, color, bgColor }) => (
                <div key={title} className={`${bgColor} p-6 rounded-xl border border-gray-600 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 bg-gradient-to-r ${color} rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-400 text-sm mb-1">{title}</h3>
                  <p className="text-3xl font-bold text-gray-100">{value}</p>
                </div>
              ))}
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Distribution */}
              <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                <h3 className="font-bold text-red-400 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Risk Distribution
                </h3>
                <div className="space-y-4">
                  {Object.entries(analytics.riskDistribution).map(([risk, count]) => {
                    const percentage = analytics.totalClaims > 0 ? (count / analytics.totalClaims * 100).toFixed(1) : 0;
                    return (
                      <div key={risk} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(risk)}`}>
                            {risk}
                          </span>
                          <span className="font-bold text-gray-100">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              risk === 'low' ? 'bg-green-500' :
                              risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Claim Types */}
              <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                <h3 className="font-bold text-purple-400 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Claim Types
                </h3>
                <div className="space-y-4">
                  {Object.entries(analytics.claimTypeDistribution).map(([type, count]) => {
                    const percentage = analytics.totalClaims > 0 ? (count / analytics.totalClaims * 100).toFixed(1) : 0;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="capitalize font-medium text-purple-400 px-3 py-1 bg-purple-900/50 border border-purple-500/50 rounded-full text-sm">
                            {type}
                          </span>
                          <span className="font-bold text-gray-100">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className={`bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl p-8 mb-8 transform transition-all duration-1000 ${
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
                AI-powered document processing with OpenAI integration and real-time analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>OpenAI Integration</span>
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
                    ? `text-${color}-400 bg-gray-700/50 border-b-4 border-${color}-500 shadow-lg`
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`transform transition-all duration-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {activeTab === 'process' && renderProcessingTab()}
          {activeTab === 'claims' && renderClaimsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>

        {/* Claim Detail Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-gray-800/95 backdrop-blur-lg rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700 transform animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-100">
                    Claim Details
                  </h2>
                  <button
                    onClick={() => setSelectedClaim(null)}
                    className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-700 rounded-lg transition-all duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h3 className="font-bold text-cyan-400 mb-4">Basic Information</h3>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: 'ID', value: selectedClaim.processingId },
                          { label: 'Claimant', value: selectedClaim.extractedData?.claimantName || 'Unknown' },
                          { label: 'Type', value: selectedClaim.extractedData?.claimType || 'Unknown' },
                          { label: 'Amount', value: selectedClaim.extractedData?.estimatedAmount ? formatCurrency(selectedClaim.extractedData.estimatedAmount) : 'N/A' },
                          { label: 'Processed', value: new Date(selectedClaim.timestamp).toLocaleString() }
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="font-medium text-gray-400">{label}:</span>
                            <span className="text-gray-100 font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h3 className="font-bold text-red-400 mb-4">Assessment Results</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-400">Risk Level:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(selectedClaim.fraudAssessment?.riskLevel || 'unknown')}`}>
                            {selectedClaim.fraudAssessment?.riskLevel || 'unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-400">Priority:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(selectedClaim.categorization?.priority?.level || 'normal')}`}>
                            {selectedClaim.categorization?.priority?.level || 'normal'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-400">Department:</span>
                          <span className="text-gray-100 font-semibold">{selectedClaim.categorization?.routing?.department || 'General'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-400">Assignment:</span>
                          <span className="text-gray-100 font-semibold">{selectedClaim.categorization?.routing?.assignmentType || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h3 className="font-bold text-green-400 mb-4">Summary</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{selectedClaim.summary?.executiveSummary || 'Summary not available'}</p>
                  </div>

                  {selectedClaim.fraudAssessment?.fraudIndicators?.length > 0 && (
                    <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                      <h3 className="font-bold text-yellow-400 mb-4">Risk Indicators</h3>
                      <div className="space-y-3">
                        {selectedClaim.fraudAssessment.fraudIndicators.map((indicator, index) => (
                          <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-100">{indicator.indicator}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                indicator.weight === 'high' ? 'bg-red-900/50 text-red-400 border border-red-500/50' :
                                indicator.weight === 'medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/50' :
                                'bg-green-900/50 text-green-400 border border-green-500/50'
                              }`}>
                                {indicator.weight}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{indicator.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h3 className="font-bold text-gray-100 mb-4">Original Document</h3>
                    <div className="max-h-48 overflow-y-auto bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                      <pre className="text-xs whitespace-pre-wrap text-gray-400">{selectedClaim.originalDocument}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .slide-in-from-bottom {
          animation: slideInFromBottom 0.5s ease-out;
        }
        .zoom-in-95 {
          animation: zoomIn95 0.3s ease-out;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes zoomIn95 {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedClaimsProcessingDemo;