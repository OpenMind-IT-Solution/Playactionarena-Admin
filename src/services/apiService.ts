import { getSession, signOut } from 'next-auth/react'
import { toast } from 'react-toastify'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || ''

const getApiUrl = (endpoint: string) => {
  if (!API_URL) {
    throw new Error('API base URL is not configured. Please set NEXT_PUBLIC_API_URL or API_URL.')
  }

  const normalizedBase = API_URL.replace(/\/+$/, '')
  const normalizedEndpoint = endpoint.replace(/^\/+/, '')

  return `${normalizedBase}/${normalizedEndpoint}`
}

const parseResponseBody = async (response: Response) => {
  const text = await response.text()

  if (!text) {
    return null
  }

  const trimmed = text.trim()

  if (!trimmed) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }

  return trimmed
}

const getErrorMessage = (payload: any, fallback: string) => {
  if (!payload) {
    return fallback
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload.errors)) {
    return payload.errors.join(', ')
  }

  return payload.errors || payload.message || payload.Message || fallback
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      await signOut({ redirect: true, callbackUrl: '/login' })
      throw new Error('Unauthorized. Token missing or expired')
    }

    const errorPayload = await parseResponseBody(response)
    const message = getErrorMessage(errorPayload, `Request failed with status ${response.status}`)

    toast.error(message)
    throw new Error(message)
  }

  const successResponse = await parseResponseBody(response)

  if (successResponse && typeof successResponse === 'object' && successResponse.ResponseStatus === 'failure') {
    const message = successResponse?.Message || 'Request failed'

    toast.error(message)
    throw new Error(message)
  }

  return successResponse
}

export const fetchData = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const session = await getSession()

    if (!session || !session?.user) {
      throw new Error('No session or access token found')
    }

    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.user.accessToken}`,
        ...options.headers
      }
    })

    
return await handleResponse(response)
  } catch (error: any) {
    console.error('Error fetching data:', error.message)

    // toast.error(error.message);
    throw error
  }
}

export const get = (endpoint: string) => fetchData(endpoint)

export const unauthorizedPost = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    
return await handleResponse(response)
  } catch (error: any) {
    console.error('Error fetching data:', error.message)
    throw error
  }
}

export const post = (endpoint: string, data: any) =>
  fetchData(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })

export const put = (endpoint: string, data: any) =>
  fetchData(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  })

export const del = (endpoint: string) =>
  fetchData(endpoint, {
    method: 'DELETE'
  })

export const postFormData = async (endpoint: string, formData: any) => {
  try {
    const session = await getSession()

    if (!session || !session?.user) {
      throw new Error('No session or access token found')
    }

    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`
      }
    })

    
return await handleResponse(response)
  } catch (error: any) {
    console.error('Error fetching data:', error)

    // toast.error(error.message);
    throw error
  }
}

// export const ExportData = async (
//   endpoint: string,
//   formData: any,
//   fileName: string
// ) => {
//   try {
//     const session = await getSession();

//     if (!session || !session?.user) {
//       throw new Error("No session or access token found");
//     }

//     const response = await fetch(`${API_URL}/${endpoint}`, {
//       method: "POST",
//       body: JSON.stringify(formData),
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${session?.user.token}`,
//       },
//     });

//     console.log("🚀 ~ response:", response)
//     if (!response.ok) {
//       const errorText = await response.json().catch(() => null);
//       toast.error(errorText?.Message || "Export Failed");
//     } else {
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;
//       document.body.appendChild(a);
//       a.click();

//       setTimeout(() => {
//         document.body.removeChild(a);
//         window.URL.revokeObjectURL(url);
//       }, 100);

//       toast.success("Export completed successfully");
//     }
//   } catch (error: any) {
//     console.error("Error exporting data:", error);
//     throw error;
//   }
// };

export const ExportData = async (endpoint: string, formData: any, fileName: string) => {
  try {
    const session = await getSession()

    if (!session || !session?.user) {
      throw new Error('No session or access token found')
    }

    const response = await axios.post(getApiUrl(endpoint), formData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.user.accessToken}`
      },
      responseType: 'blob'
    })

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 100)

    toast.success('Export completed successfully')
  } catch (error: any) {
    console.log('🚀 ~ error:', error.response)
    console.error('Error exporting data:', error)
    toast.error(error.response?.Message || 'No data available for export based on the selected criteria.')
    throw error
  }
}
