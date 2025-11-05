// Form validation utilities

export const validateRUT = (rut: string): boolean => {
  // Remove dots and hyphens
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "")

  if (cleanRut.length < 2) return false

  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  // Calculate verification digit
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDv = 11 - (sum % 11)
  const calculatedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : String(expectedDv)

  return dv === calculatedDv
}

export const formatRUT = (rut: string): string => {
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "")
  if (cleanRut.length < 2) return rut

  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)

  // Add dots every 3 digits from right to left
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${formattedBody}-${dv}`
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Chilean phone format: +56 9 XXXX XXXX or 9 XXXX XXXX
  const phoneRegex = /^(\+?56)?9\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}
