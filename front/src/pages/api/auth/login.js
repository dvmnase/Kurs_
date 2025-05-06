export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    // Здесь должна быть проверка учетных данных в базе данных
    // Для примера используем тестовые данные
    if (email === 'test@example.com' && password === 'password') {
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }
      
      // В реальном приложении здесь должен быть JWT токен
      const token = 'test-token'

      return res.status(200).json({
        user,
        token
      })
    }

    return res.status(401).json({ message: 'Неверные учетные данные' })
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера' })
  }
} 