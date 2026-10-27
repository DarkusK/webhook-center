export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json()
    if (Array.isArray(data.message)) {
      return data.message.join(',')
    }
    if (typeof data.message === 'string') {
      return data.message
    }
    return fallback
  } catch {
    return fallback
  }
}
