type LoginCredentials = {
    email: string
    password: string
  }
  
  type RegisterData = {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
  }
  
  type AuthResponse = {
    token: string
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: string
    }
  }
  
  export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch("http://ec2-52-91-35-107.compute-1.amazonaws.com:5000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })
  
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to login")
    }
  
    return response.json()
  }
  
  export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch("http://ec2-52-91-35-107.compute-1.amazonaws.com:5000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
  
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to register")
    }
  
    return response.json()
  }
  
  