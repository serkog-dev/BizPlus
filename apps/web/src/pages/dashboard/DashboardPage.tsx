import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  PersonAdd as NewCustomerIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/auth.store'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA726',
  CONFIRMED: '#66BB6A',
  COMPLETED: '#42A5F5',
  CANCELLED: '#EF5350',
  NO_SHOW: '#9E9E9E',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  CONFIRMED: 'אושר',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
  NO_SHOW: 'לא הגיע',
}

function StatCard({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 52, height: 52 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const tenant = useAuthStore(s => s.tenant)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => api.getDashboardToday(),
  })

  const today = data?.data
  const appointments: any[] = today?.appointments ?? []
  const stats = today?.stats ?? {}

  const upcoming = appointments
    .filter((a: any) => ['PENDING', 'CONFIRMED'].includes(a.status))
    .slice(0, 8)

  const now = new Date()
  const dateStr = now.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('dashboard.todayTitle')} 👋
        </Typography>
        <Typography color="text.secondary">{dateStr}</Typography>
        {tenant?.name && (
          <Typography variant="body2" color="primary" fontWeight={500}>
            {tenant.name}
          </Typography>
        )}
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('dashboard.totalAppointments')}
            value={stats.total ?? 0}
            icon={<CalendarIcon />}
            color="#5C6BC0"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('dashboard.completedAppointments')}
            value={stats.completed ?? 0}
            icon={<CheckIcon />}
            color="#66BB6A"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('dashboard.pendingAppointments')}
            value={stats.pending ?? 0}
            icon={<PendingIcon />}
            color="#FFA726"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title={t('dashboard.cancelledAppointments')}
            value={stats.cancelled ?? 0}
            icon={<CancelIcon />}
            color="#EF5350"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Today's Revenue */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MoneyIcon color="success" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('dashboard.todayRevenue')}
                </Typography>
              </Box>
              {isLoading ? (
                <Skeleton width={120} height={50} />
              ) : (
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {(stats.revenue ?? 0).toLocaleString('he-IL')}₪
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NewCustomerIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('dashboard.newCustomers')}
                </Typography>
              </Box>
              {isLoading ? (
                <Skeleton width={80} height={50} />
              ) : (
                <Typography variant="h3" fontWeight={700} color="primary">
                  {stats.newCustomers ?? 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                {t('dashboard.upcomingAppointments')}
              </Typography>
              <Divider sx={{ mb: 1 }} />

              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} sx={{ py: 1 }}>
                    <Skeleton height={40} />
                  </Box>
                ))
              ) : upcoming.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'grey.300' }} />
                  <Typography color="text.secondary">
                    {t('dashboard.noAppointmentsToday')}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {upcoming.map((appt: any) => {
                    const startTime = new Date(appt.startTime).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const customerName = `${appt.customer?.firstName ?? ''} ${appt.customer?.lastName ?? ''}`.trim()
                    return (
                      <ListItem key={appt.id} disablePadding sx={{ py: 0.75 }}>
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 13 }}>
                            {appt.customer?.firstName?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {startTime}
                              </Typography>
                              <Typography variant="body2">{customerName}</Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                              <Typography variant="caption" color="text.secondary">
                                {appt.service?.name}
                              </Typography>
                              {appt.provider && (
                                <Typography variant="caption" color="text.secondary">
                                  • {appt.provider.user?.firstName}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Chip
                          label={STATUS_LABELS[appt.status] ?? appt.status}
                          size="small"
                          sx={{
                            bgcolor: STATUS_COLORS[appt.status] + '22',
                            color: STATUS_COLORS[appt.status],
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </ListItem>
                    )
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
