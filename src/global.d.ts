declare global {
  interface Window {
    $message?: {
      error: (content: string) => void
      success?: (content: string) => void
      warning?: (content: string) => void
    }
  }
}

export {}
