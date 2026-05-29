import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton,
} from '@mui/material'
import {
  Visibility, VisibilityOff,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../api/client'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.adminLogin(email, password)
      setAuth(res.data.data.admin, res.data.data.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'אימייל או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: 'primary.main',
    }}>
      <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AdminIcon sx={{ fontSize: 52, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={800} mt={1}>
              BizPlus
            </Typography>
            <Typography variant="body2" color="text.secondary">
              פאנל ניהול מערכת
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth label="אימייל מנהל"
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required sx={{ mb: 2 }} autoFocus
            />
            <TextField
              fullWidth label="סיסמה"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth type="submit" variant="contained"
              size="large" disabled={loading}
            >
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
