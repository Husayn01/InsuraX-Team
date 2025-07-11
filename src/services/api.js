const API_URL = 'http://localhost:3001'

// Helper to add auth headers
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/users?email=${email}`)
    const users = await response.json()
    
    if (users.length > 0 && users[0].password === password) {
      const user = users[0]
      delete user.password // Don't store password
      return { success: true, user }
    }
    
    throw new Error('Invalid credentials')
  },

  // Users
  getUser: async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}`)
    return response.json()
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_URL}/users`)
    return response.json()
  },

  getCustomers: async () => {
    const response = await fetch(`${API_URL}/users?role=customer`)
    const customers = await response.json()
    
    // Enrich customer data with their claims and policies
    const enrichedCustomers = await Promise.all(customers.map(async (customer) => {
      const claims = await api.getClaimsByCustomer(customer.id)
      const policies = await api.getPoliciesByCustomer(customer.id)
      const payments = await api.getPaymentsByCustomer(customer.id)
      
      return {
        ...customer,
        claims: {
          total: claims.length,
          approved: claims.filter(c => c.status === 'approved').length,
          rejected: claims.filter(c => c.status === 'rejected').length,
          pending: claims.filter(c => ['submitted', 'processing'].includes(c.status)).length,
          totalAmount: claims.reduce((sum, c) => sum + (c.claim_data?.estimatedAmount || 0), 0)
        },
        policies: policies,
        lifetime: {
          premiumsPaid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
          claimsPaid: claims.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.claim_data?.estimatedAmount || 0), 0)
        },
        riskScore: calculateRiskScore(claims),
        lastActivity: claims[0]?.created_at || customer.created_at || new Date().toISOString()
      }
    }))
    
    return enrichedCustomers
  },

  updateUser: async (userId, data) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  },

  // Claims - Customer specific
  getClaims: async (customerId) => {
    const response = await fetch(`${API_URL}/claims?customer_id=${customerId}&_sort=created_at&_order=desc`)
    return response.json()
  },

  // Claims - Insurer (all claims)
  getAllClaims: async () => {
    const response = await fetch(`${API_URL}/claims?_sort=created_at&_order=desc`)
    const claims = await response.json()
    
    // Enrich claims with customer data
    const enrichedClaims = await Promise.all(claims.map(async (claim) => {
      const customer = await api.getUser(claim.customer_id)
      const customerClaims = await api.getClaimsByCustomer(claim.customer_id)
      
      return {
        ...claim,
        customer: {
          id: customer.id,
          name: customer.full_name || customer.company_name,
          email: customer.email,
          phone: customer.phone,
          totalClaims: customerClaims.length,
          riskScore: calculateRiskScore(customerClaims)
        }
      }
    }))
    
    return enrichedClaims
  },

  getClaimsByCustomer: async (customerId) => {
    const response = await fetch(`${API_URL}/claims?customer_id=${customerId}`)
    return response.json()
  },

  getClaim: async (claimId) => {
    const response = await fetch(`${API_URL}/claims/${claimId}`)
    const claim = await response.json()
    
    // Enrich with customer and message data
    const customer = await api.getUser(claim.customer_id)
    const messages = await api.getClaimMessages(claimId)
    const customerClaims = await api.getClaimsByCustomer(claim.customer_id)
    const policies = await api.getPoliciesByCustomer(claim.customer_id)
    const payments = await api.getPaymentsByCustomer(claim.customer_id)
    
    return {
      ...claim,
      customer: {
        ...customer,
        totalClaims: customerClaims.length,
        approvedClaims: customerClaims.filter(c => c.status === 'approved').length,
        totalPremiumPaid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
        riskScore: calculateRiskScore(customerClaims),
        paymentHistory: payments.length > 0 ? 'excellent' : 'new'
      },
      messages: messages,
      // Mock AI analysis data
      aiAnalysis: {
        confidence: 0.85,
        processingTime: '2.3s',
        extractedData: {
          damageType: 'Collision - Rear Impact',
          severity: 'Moderate',
          repairCategory: 'Body Work',
          estimatedRepairTime: '5-7 days'
        },
        similarClaims: [
          { claimNumber: 'CLM-2024-089', similarity: 0.92, outcome: 'Approved', amount: 4800 },
          { claimNumber: 'CLM-2024-045', similarity: 0.87, outcome: 'Approved', amount: 5200 }
        ]
      },
      fraudAssessment: {
        score: claim.fraudScore || 0.15,
        riskLevel: claim.riskLevel || 'low',
        indicators: generateFraudIndicators(claim),
        recommendation: claim.fraudScore > 0.7 ? 'Manual review required - High fraud risk' : 'Approve claim - Low fraud risk detected'
      },
      timeline: generateClaimTimeline(claim)
    }
  },

  createClaim: async (claim) => {
    const response = await fetch(`${API_URL}/claims`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...claim,
        id: `claim-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })
    return response.json()
  },

  updateClaim: async (claimId, data) => {
    const response = await fetch(`${API_URL}/claims/${claimId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        ...data,
        updated_at: new Date().toISOString()
      })
    })
    return response.json()
  },

  // Payments
  getPayments: async (customerId) => {
    const response = await fetch(`${API_URL}/payments?customer_id=${customerId}&_sort=created_at&_order=desc`)
    return response.json()
  },

  getPaymentsByCustomer: async (customerId) => {
    const response = await fetch(`${API_URL}/payments?customer_id=${customerId}`)
    return response.json()
  },

  createPayment: async (payment) => {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...payment,
        id: `pay-${Date.now()}`,
        created_at: new Date().toISOString()
      })
    })
    return response.json()
  },

  // Notifications
  getNotifications: async (userId) => {
    const response = await fetch(`${API_URL}/notifications?user_id=${userId}&_sort=created_at&_order=desc`)
    return response.json()
  },

  updateNotification: async (notifId, data) => {
    const response = await fetch(`${API_URL}/notifications/${notifId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  },

  createNotification: async (notification) => {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...notification,
        id: `notif-${Date.now()}`,
        created_at: new Date().toISOString()
      })
    })
    return response.json()
  },

  deleteNotification: async (notifId) => {
    const response = await fetch(`${API_URL}/notifications/${notifId}`, {
      method: 'DELETE'
    })
    return response.ok
  },

  // Policies
  getPolicies: async () => {
    const response = await fetch(`${API_URL}/policies`)
    return response.json()
  },

  getPoliciesByCustomer: async (customerId) => {
    const response = await fetch(`${API_URL}/policies?customer_id=${customerId}`)
    return response.json()
  },

  // Messages
  getClaimMessages: async (claimId) => {
    const response = await fetch(`${API_URL}/messages?claim_id=${claimId}&_sort=timestamp&_order=asc`)
    return response.json()
  },

  createMessage: async (message) => {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString()
      })
    })
    return response.json()
  },

  // Analytics
  getAnalytics: async () => {
    const response = await fetch(`${API_URL}/analytics`)
    const analytics = await response.json()
    
    // If analytics is an array, return the first item
    if (Array.isArray(analytics)) {
      return analytics[0] || generateDefaultAnalytics()
    }
    
    return analytics || generateDefaultAnalytics()
  }
}

// Helper functions
const calculateRiskScore = (claims) => {
  if (!claims || claims.length === 0) return 'low'
  
  const rejectedRatio = claims.filter(c => c.status === 'rejected').length / claims.length
  const highFraudCount = claims.filter(c => c.fraudScore > 0.7).length
  
  if (rejectedRatio > 0.3 || highFraudCount > 2) return 'high'
  if (rejectedRatio > 0.1 || highFraudCount > 0) return 'medium'
  return 'low'
}

const generateFraudIndicators = (claim) => {
  const indicators = []
  
  if (claim.fraudScore < 0.3) {
    indicators.push(
      { type: 'positive', message: 'Claim details match policy records' },
      { type: 'positive', message: 'Documentation appears authentic' }
    )
  }
  
  if (claim.fraudScore > 0.5) {
    indicators.push(
      { type: 'negative', message: 'Unusual claim pattern detected' },
      { type: 'neutral', message: 'Requires additional verification' }
    )
  }
  
  if (claim.claim_data?.claimType === 'auto') {
    indicators.push({ type: 'positive', message: 'Vehicle information verified' })
  }
  
  return indicators
}

const generateClaimTimeline = (claim) => {
  const timeline = [
    {
      date: claim.created_at,
      event: 'Claim Submitted',
      user: claim.claim_data?.claimantName || 'Customer',
      details: 'Initial claim submission'
    }
  ]
  
  if (claim.status !== 'submitted') {
    timeline.push({
      date: new Date(new Date(claim.created_at).getTime() + 86400000).toISOString(),
      event: 'Under Review',
      user: 'System',
      details: 'Claim assigned for review'
    })
  }
  
  if (claim.status === 'processing') {
    timeline.push({
      date: claim.updated_at,
      event: 'Processing',
      user: 'AI System',
      details: 'NeuroClaim AI analysis complete'
    })
  }
  
  if (claim.status === 'approved' || claim.status === 'rejected') {
    timeline.push({
      date: claim.updated_at,
      event: claim.status === 'approved' ? 'Approved' : 'Rejected',
      user: 'Adjuster',
      details: `Claim ${claim.status}`
    })
  }
  
  return timeline
}

const generateDefaultAnalytics = () => ({
  summary: {
    totalClaims: 0,
    totalAmount: 0,
    approvalRate: 0,
    averageProcessingTime: 0,
    fraudDetectionRate: 0,
    customerSatisfaction: 0
  },
  monthlyData: []
})