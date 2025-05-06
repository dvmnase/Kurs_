const APP_KEY = '@RemontPro:token'

const isBrowser = typeof window !== 'undefined'

export const getToken = () => {
  if (!isBrowser) return null

  const tokenLocalStorage = localStorage.getItem(`${APP_KEY}`)
  return tokenLocalStorage ? JSON.parse(tokenLocalStorage) : null
}

export const setToken = (token) => {
  if (!isBrowser) return

  localStorage.setItem(`${APP_KEY}`, JSON.stringify(token))
}

export const removeToken = () => {
  if (!isBrowser) return

  localStorage.removeItem(`${APP_KEY}`)
}
