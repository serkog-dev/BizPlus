import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Grid,
  Chip,
} from '@mui/material'
import { Business as BusinessIcon, CheckCircle as CheckIcon } from '@mui/icons-material'
import { useAuthStore } from '../../stores/auth.store'
import { api } from '../../api/client'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [form, setForm] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.register({
        tenantName: form.businessName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      setAuth(res.data.user, res.data.tenant, res.data.accessToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'שגיאה בהרשמה. נסה שנית.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 520, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BusinessIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700} mt={1}>
              BizPlus
            </Typography>
          </Box>

          <Typography variant="h6" fontWeight={600} mb={1}>
            {t('auth.register')}
          </Typography>

          <Chip
            icon={<CheckIcon />}
            label={t('auth.trialInfo')}
            color="success"
            variant="outlined"
            size="small"
            sx={{ mb: 3 }}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label={t('auth.businessName')}
              value={form.businessName}
              onChange={handleChange('businessName')}
              required
              sx={{ mb: 2 }}
              autoFocus
              placeholder="מספרת שגב, קליניקת דר לוי..."
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.firstName')}
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label={t('auth.lastName')}
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  required
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label={t('auth.email')}
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              required
              sx={{ mb: 2 }}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label={t('auth.businessPhone')}
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              required
              sx={{ mb: 2 }}
              placeholder="050-1234567"
              inputProps={{ dir: 'ltr' }}
            />

            <TextField
              fullWidth
              label={t('auth.password')}
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              required
              sx={{ mb: 3 }}
              autoComplete="new-password"
              helperText="לפחות 8 תווים"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              loading={loading}
              sx={{ mb: 2 }}
            >
              {t('auth.registerButton')}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                {t('auth.loginButton')}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
