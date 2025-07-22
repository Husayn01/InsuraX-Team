// Simple localStorage wrapper for auth
export const localAuth = {
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
  }
}