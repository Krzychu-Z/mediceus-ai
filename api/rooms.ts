export type OperatingRoom = {
    id: number
    name: string
    status: string
  }
  
  export async function getRooms(): Promise<OperatingRoom[]> {
    const response = await fetch("https://ec2-52-91-35-107.compute-1.amazonaws.com:5000/api/rooms", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add authorization header if needed
        // 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      },
    })
  
    if (!response.ok) {
      throw new Error("Failed to fetch operating rooms")
    }
  
    return response.json()
  }
  
  
