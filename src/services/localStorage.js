// Simple localStorage wrapper for auth
export const localAuth = {
  // localStorage methods (persistent)
  setUser: (user) => {
    localStorage.setItem('insurax_user', JSON.stringify(user))
  },
  
  getUser: () => {
    const user = localStorage.getItem('insurax_user')
    return user ? JSON.parse(user) : null
  },
  
  removeUser: () => {
    localStorage.removeItem('insurax_user')
  },
  
  setToken: (token) => {
    localStorage.setItem('insurax_token', token)
  },
  
  getToken: () => {
    return localStorage.getItem('insurax_token')
  },
  
  removeToken: () => {
    localStorage.removeItem('insurax_token')
  },
  
  // sessionStorage methods (session-only)
  setSessionUser: (user) => {
    sessionStorage.setItem('insurax_user', JSON.stringify(user))
  },
  
  getSessionUser: () => {
    const user = sessionStorage.getItem('insurax_user')
    return user ? JSON.parse(user) : null
  },
  
  removeSessionUser: () => {
    sessionStorage.removeItem('insurax_user')
  },
  
  setSessionToken: (token) => {
    sessionStorage.setItem('insurax_token', token)
  },
  
  getSessionToken: () => {
    return sessionStorage.getItem('insurax_token')
  },
  
  removeSessionToken: () => {
    sessionStorage.removeItem('insurax_token')
  },
  
  // Helper to clear all auth data
  clearAll: () => {
    // Clear localStorage
    localStorage.removeItem('insurax_user')
    localStorage.removeItem('insurax_token')
    localStorage.removeItem('insurax_remember_me')
    
    // Clear sessionStorage
    sessionStorage.removeItem('insurax_user')
    sessionStorage.removeItem('insurax_token')
  }
}