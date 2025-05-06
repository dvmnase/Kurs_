import React, { useState, useCallback, useEffect, useRef } from 'react'
import cn from 'classnames'
import { useRouter } from 'next/router'
import AppLink from '../AppLink'
import Loader from '../Loader'
import registerFields from '../../utils/constants/registerFields'
import { useStateContext } from '../../utils/context/StateContext'
import { setToken } from '../../utils/token'

import styles from './OAuth.module.sass'

const OAuth = ({ className, handleClose, handleOAuth, disable }) => {
  const { setUser } = useStateContext()
  const { push } = useRouter()

  const [{ email, password }, setFields] = useState(() => registerFields)
  const [fillFiledMessage, setFillFiledMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const inputElement = useRef(null)

  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus()
    }
  }, [disable])

  const handleGoHome = () => {
    push('/')
  }

  const handleChange = ({ target: { name, value } }) =>
    setFields(prevFields => ({
      ...prevFields,
      [name]: value,
    }))

  const submitForm = useCallback(
    async e => {
      e.preventDefault()
      fillFiledMessage?.length && setFillFiledMessage('')
      setLoading(true)

      if (email && password) {
        try {
          const auth = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await auth.json()

          if (auth.ok && data.user) {
            setUser(data.user)
            setToken({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              // Add any other user fields you need
            })
            setFillFiledMessage('Login successful!')
            handleOAuth(data.user)
            setFields(registerFields)
            handleClose()
          } else {
            setFillFiledMessage(data.message || 'Login failed')
          }
        } catch (error) {
          setFillFiledMessage('An error occurred during login')
          console.error('Login error:', error)
        }
      } else {
        setFillFiledMessage('Please fill all fields')
      }
      setLoading(false)
    },
    [email, password, setUser, handleOAuth, handleClose, fillFiledMessage?.length]
  )

  return (
    <div className={cn(className, styles.transfer)}>
      <div className={cn('h4', styles.title)}>Login</div>
      <div className={styles.text}>
        Please enter your credentials to login
      </div>
      <div className={styles.error}>{fillFiledMessage}</div>
      <form className={styles.form} onSubmit={submitForm}>
        <div className={styles.field}>
          <input
            ref={inputElement}
            className={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={email}
            required
          />
        </div>
        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            value={password}
            required
          />
        </div>
        <div className={styles.btns}>
          <button type="submit" className={cn('button', styles.button)}>
            {loading ? <Loader /> : 'Continue'}
          </button>
          <button
            onClick={disable ? handleGoHome : handleClose}
            className={cn('button-stroke', styles.button)}
          >
            {disable ? 'Return Home Page' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OAuth