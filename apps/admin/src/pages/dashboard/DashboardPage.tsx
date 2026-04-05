import { useQuery } from '@tanstack/react-query'
import {
  Box, Grid, Card, CardContent, Typography,
  Skeleton, Divider, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Chip,
} from '@mui/material'
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
  FiberNew as NewIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'

const PLAN_COLORS: Record<string, string> = {
  TRIAL: '#FFA726',
  BASIC: '#42A5F5',
  PROFESSIONAL: '#66BB6A',
  ENTERPRISE: '#AB47BC',
}

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  TRIAL: 'warning',
  ACTIVE: 'success',
  PAST_DUE: 'error',
  CANCELLED: 'default',
  SUSPENDED: 'error',
}

function StatCard({ title, value, icon, color, subtitle, loading }: any) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
            {loading ? <Skeleton width={80} height={44} /> : (
              <Typography variant="h4" fontWeight={700}>{value}</Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 50, height: 50 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.getStats(),
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants', 'recent'],
    queryFn: () => api.getTenants({ limit: 8, page: 1 }),
  })

  const stats = statsData?.data?.data ?? {}
  const recentTenants: any[] = tenantsData?.data?.data?.items ?? []

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>דשבורד ניהול</Typography>
        <Typography color="text.secondary" variant="body2">
          סקירה כללית של פלטפורמת BizPlus
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="סה״כ עסקים"
            value={stats.totalTenants ?? 0}
            icon={<BusinessIcon />}
            color="#1a237e"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="עסקים פעילים"
            value={stats.activeTenants ?? 0}
            icon={<TrendingIcon />}
            color="#66BB6A"
            subtitle={`${stats.trialTenants ?? 0} בתקופת ניסיון`}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="הכנסות החודש"
            value={`₪${(stats.monthlyRevenue ?? 0).toLocaleString('he-IL')}`}
            icon={<MoneyIcon />}
            color="#FFA726"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="סה״כ לקוחות"
            value={(stats.totalCustomers ?? 0).toLocaleString('he-IL')}
            icon={<PeopleIcon />}
            color="#AB47BC"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Recent Tenants */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NewIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>עסקים אחרונים</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {recentTenants.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  אין עסקים עדיין
                </Typography>
              ) : (
                <List disablePadding>
                  {recentTenants.map((t: any) => (
                    <ListItem key={t.id} disablePadding sx={{ py: 0.75 }}>
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: PLAN_COLORS[t.subscription?.plan ?? 'TRIAL'] + '33', color: PLAN_COLORS[t.subscription?.plan ?? 'TRIAL'], fontSize: 14, fontWeight: 700 }}>
                          {t.name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{t.name}</Typography>}
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(t.createdAt).toLocaleDateString('he-IL')} • {t.slug}
                          </Typography>
                        }
                      />
                      <Chip
                        label={t.subscription?.plan ?? 'TRIAL'}
                        size="small"
                        color={STATUS_COLORS[t.subscription?.status ?? 'TRIAL']}
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Plan breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                פילוח לפי תוכנית
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { key: 'TRIAL', label: 'ניסיון חינם', color: '#FFA726' },
                { key: 'BASIC', label: 'בייסיק', color: '#42A5F5' },
                { key: 'PROFESSIONAL', label: 'פרופשיונל', color: '#66BB6A' },
                { key: 'ENTERPRISE', label: 'אנטרפרייז', color: '#AB47BC' },
              ].map(plan => {
                const count = stats.planBreakdown?.[plan.key] ?? 0
                const total = stats.totalTenants || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <Box key={plan.key} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{plan.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{count}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'grey.200', borderRadius: 4, height: 8 }}>
                      <Box sx={{ bgcolor: plan.color, borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </Box>
                  </Box>
                )
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
