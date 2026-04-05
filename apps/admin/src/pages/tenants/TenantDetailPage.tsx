import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Card, CardContent, Grid, Chip,
  Button, Select, MenuItem, FormControl, InputLabel,
  Divider, Avatar, Skeleton, Alert,
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { useState } from 'react'
import { api } from '../../api/client'

const STATUS_COLOR: Record<string, any> = {
  TRIAL: 'warning', ACTIVE: 'success', PAST_DUE: 'error',
  CANCELLED: 'default', SUSPENDED: 'error',
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newStatus, setNewStatus] = useState('')
  const [newPlan, setNewPlan] = useState('')
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: () => api.getTenant(id!),
  })

  const tenant = data?.data?.data

  const mutation = useMutation({
    mutationFn: () => api.updateTenant(id!, {
      subscriptionStatus: newStatus || undefined,
      plan: newPlan || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenant', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading) return <Box sx={{ p: 3 }}><Skeleton height={400} /></Box>
  if (!tenant) return <Typography>לא נמצא</Typography>

  const sub = tenant.subscription ?? {}

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/tenants')} variant="outlined">
          חזרה
        </Button>
        <Box>
          <Typography variant="h5" fontWeight={800}>{tenant.name}</Typography>
          <Typography variant="body2" color="text.secondary">{tenant.slug}</Typography>
        </Box>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>השינויים נשמרו בהצלחה</Alert>}

      <Grid container spacing={2}>
        {/* Stats */}
        {[
          { label: 'תורים', value: tenant._count?.appointments ?? 0 },
          { label: 'לקוחות', value: tenant._count?.customers ?? 0 },
          { label: 'שירותים', value: tenant._count?.services ?? 0 },
          { label: 'צוות', value: tenant._count?.providers ?? 0 },
        ].map(s => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} color="primary">{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Subscription management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>ניהול מנוי</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={sub.plan ?? '—'} color="primary" variant="outlined" />
                <Chip
                  label={sub.status ?? '—'}
                  color={STATUS_COLOR[sub.status] ?? 'default'}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>שנה תוכנית</InputLabel>
                    <Select value={newPlan} label="שנה תוכנית"
                      onChange={e => setNewPlan(e.target.value)}>
                      <MenuItem value="">ללא שינוי</MenuItem>
                      <MenuItem value="BASIC">בייסיק</MenuItem>
                      <MenuItem value="PROFESSIONAL">פרופשיונל</MenuItem>
                      <MenuItem value="ENTERPRISE">אנטרפרייז</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>שנה סטטוס</InputLabel>
                    <Select value={newStatus} label="שנה סטטוס"
                      onChange={e => setNewStatus(e.target.value)}>
                      <MenuItem value="">ללא שינוי</MenuItem>
                      <MenuItem value="TRIAL">ניסיון</MenuItem>
                      <MenuItem value="ACTIVE">פעיל</MenuItem>
                      <MenuItem value="SUSPENDED">מושהה</MenuItem>
                      <MenuItem value="CANCELLED">בוטל</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                variant="contained" sx={{ mt: 2 }} fullWidth
                onClick={() => mutation.mutate()}
                disabled={(!newStatus && !newPlan) || mutation.isPending}
              >
                {mutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Business info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>פרטי עסק</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'שם עסק', value: tenant.name },
                { label: 'Slug', value: tenant.slug },
                { label: 'תאריך הצטרפות', value: new Date(tenant.createdAt).toLocaleDateString('he-IL') },
                { label: 'תקופת ניסיון מסתיימת', value: sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString('he-IL') : '—' },
                { label: 'מחיר חודשי', value: sub.monthlyPrice ? `₪${sub.monthlyPrice}` : '—' },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Users */}
        {tenant.users?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>משתמשים</Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {tenant.users.map((u: any) => (
                    <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>{u.firstName?.[0]}</Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight={600}>{u.firstName} {u.lastName}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">{u.role}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
