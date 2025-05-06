export default async function authHandler(req, res) {
  try {
    const auth = await fetch('http://localhost:8080/auth/signin', { // Change to your auth endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    const data = await auth.json()
    const user = data.user

    if (user) {
      res.status(200).json({ user })
    } else {
      res.status(409).json('Please first login')
    }
  } catch (error) {
    console.error(error)
    res.status(404).json({ message: error.message })
  }
}