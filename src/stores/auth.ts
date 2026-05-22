import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')

  async function login(user: string, password: string) {
    const res: any = await request.post('/auth/login', { username: user, password })
    token.value = res.data.token
    username.value = res.data.username
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('username', res.data.username)
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  const isLoggedIn = () => !!token.value

  return { token, username, login, logout, isLoggedIn }
})
