import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import heLocale from '@fullcalendar/core/locales/he'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Grid,
  Alert,
  Autocomplete,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon,
  Done as CompleteIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'

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

function NewAppointmentDialog({
  open,
  onClose,
  initialDate,
}: {
  open: boolean
  onClose: () => void
  initialDate?: Date
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    customerId: '',
    serviceId: '',
    providerId: '',
    date: initialDate ? initialDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    slotTime: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: api.getServices })
  const { data: providers } = useQuery({ queryKey: ['providers'], queryFn: api.getProviders })
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => api.getCustomers() })

  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ['availability', form.serviceId, form.providerId, form.date],
    queryFn: () => api.getAvailability({
      serviceId: form.serviceId,
      providerId: form.providerId || undefined,
      date: form.date,
    }),
    enabled: !!(form.serviceId && form.date),
  })

  const slots: string[] = availabilityData?.data?.slots ?? []

  const mutation = useMutation({
    mutationFn: (data: any) => api.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'שגיאה בקביעת תור')
    },
  })

  const handleSubmit = () => {
    if (!form.customerId || !form.serviceId || !form.slotTime) {
      setError('יש למלא את כל השדות החובה')
      return
    }
    mutation.mutate({
      customerId: form.customerId,
      serviceId: form.serviceId,
      providerId: form.providerId || undefined,
      startTime: `${form.date}T${form.slotTime}:00`,
      notes: form.notes,
    })
  }

  const serviceList: any[] = services?.data ?? []
  const providerList: any[] = providers?.data ?? []
  const customerList: any[] = customers?.data?.items ?? []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('appointments.newAppointment')}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={customerList}
              getOptionLabel={(c: any) => `${c.firstName} ${c.lastName} - ${c.phone}`}
              onChange={(_, v) => setForm(p => ({ ...p, customerId: v?.id ?? '' }))}
              renderInput={params => (
                <TextField {...params} label={t('appointments.selectCustomer')} required />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={t('appointments.selectService')}
              value={form.serviceId}
              onChange={e => setForm(p => ({ ...p, serviceId: e.target.value, slotTime: '' }))}
              required
            >
              {serviceList.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} — {s.duration} דק' — {s.price}₪
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={t('appointments.selectProvider')}
              value={form.providerId}
              onChange={e => setForm(p => ({ ...p, providerId: e.target.value, slotTime: '' }))}
            >
              <MenuItem value="">לא משנה לי</MenuItem>
              {providerList.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.user?.firstName} {p.user?.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label={t('appointments.selectDate')}
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value, slotTime: '' }))}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              {t('appointments.availableSlots')}
            </Typography>
            {loadingSlots ? (
              <Typography variant="body2" color="text.secondary">טוען זמנים...</Typography>
            ) : slots.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {form.serviceId ? t('appointments.noSlots') : 'בחר שירות ותאריך'}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slots.map(slot => (
                  <Chip
                    key={slot}
                    label={slot}
                    onClick={() => setForm(p => ({ ...p, slotTime: slot }))}
                    variant={form.slotTime === slot ? 'filled' : 'outlined'}
                    color={form.slotTime === slot ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer', fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('common.notes')}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          loading={mutation.isPending}
          disabled={!form.customerId || !form.serviceId || !form.slotTime}
        >
          קבע תור
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function AppointmentDetailDialog({
  appointment,
  onClose,
}: {
  appointment: any
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      api.updateAppointmentStatus(appointment.id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })

  if (!appointment) return null

  const startTime = new Date(appointment.startTime)
  const endTime = new Date(appointment.endTime)

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        פרטי תור
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{appointment.customer?.firstName} {appointment.customer?.lastName}</Typography>
            <Chip
              label={STATUS_LABELS[appointment.status]}
              sx={{
                bgcolor: STATUS_COLORS[appointment.status] + '22',
                color: STATUS_COLORS[appointment.status],
                fontWeight: 600,
              }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary">שירות</Typography>
            <Typography fontWeight={500}>{appointment.service?.name}</Typography>
          </Box>

          {appointment.provider && (
            <Box>
              <Typography variant="body2" color="text.secondary">נותן שירות</Typography>
              <Typography fontWeight={500}>
                {appointment.provider?.user?.firstName} {appointment.provider?.user?.lastName}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">תאריך ושעה</Typography>
            <Typography fontWeight={500}>
              {startTime.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' '}
              {startTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              {' — '}
              {endTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">מחיר</Typography>
            <Typography fontWeight={500}>{appointment.price}₪</Typography>
          </Box>

          {appointment.notes && (
            <Box>
              <Typography variant="body2" color="text.secondary">הערות</Typography>
              <Typography>{appointment.notes}</Typography>
            </Box>
          )}

          {showCancelInput && (
            <TextField
              fullWidth
              label={t('appointments.cancelReason')}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              size="small"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, flexWrap: 'wrap', gap: 1 }}>
        {appointment.status === 'PENDING' && (
          <Button
            startIcon={<ConfirmIcon />}
            variant="contained"
            color="success"
            size="small"
            onClick={() => statusMutation.mutate({ status: 'CONFIRMED' })}
            loading={statusMutation.isPending}
          >
            {t('appointments.confirmAppointment')}
          </Button>
        )}
        {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
          <>
            <Button
              startIcon={<CompleteIcon />}
              variant="contained"
              color="primary"
              size="small"
              onClick={() => statusMutation.mutate({ status: 'COMPLETED' })}
              loading={statusMutation.isPending}
            >
              {t('appointments.completeAppointment')}
            </Button>
            <Button
              startIcon={<CancelIcon />}
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                if (showCancelInput) {
                  statusMutation.mutate({ status: 'CANCELLED', reason: cancelReason })
                } else {
                  setShowCancelInput(true)
                }
              }}
              loading={statusMutation.isPending}
            >
              {showCancelInput ? 'אשר ביטול' : t('appointments.cancelAppointment')}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={() => statusMutation.mutate({ status: 'NO_SHOW' })}
            >
              {t('appointments.noShowAppointment')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default function AppointmentsPage() {
  const { t } = useTranslation()
  const calendarRef = useRef<any>(null)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const { data } = useQuery({
    queryKey: ['appointments', dateRange.start, dateRange.end],
    queryFn: () => api.getAppointments({ from: dateRange.start, to: dateRange.end }),
    enabled: !!(dateRange.start && dateRange.end),
  })

  const appointments: any[] = data?.data?.items ?? []

  const calendarEvents = appointments.map((a: any) => ({
    id: a.id,
    title: `${a.customer?.firstName} ${a.customer?.lastName} - ${a.service?.name}`,
    start: a.startTime,
    end: a.endTime,
    backgroundColor: STATUS_COLORS[a.status],
    borderColor: STATUS_COLORS[a.status],
    extendedProps: { appointment: a },
  }))

  const handleDatesSet = useCallback((info: any) => {
    setDateRange({
      start: info.startStr.slice(0, 10),
      end: info.endStr.slice(0, 10),
    })
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('appointments.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewDialogOpen(true)}
        >
          {t('appointments.newAppointment')}
        </Button>
      </Box>

      {/* Status Legend */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <Chip
            key={status}
            label={label}
            size="small"
            sx={{
              bgcolor: STATUS_COLORS[status] + '22',
              color: STATUS_COLORS[status],
              fontWeight: 600,
              fontSize: 11,
            }}
          />
        ))}
      </Box>

      {/* Calendar */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
          boxShadow: 1,
          '& .fc': { fontFamily: 'Heebo, sans-serif' },
          '& .fc-toolbar-title': { fontSize: '1.1rem', fontWeight: 700 },
          '& .fc-event': { cursor: 'pointer', borderRadius: '4px' },
          '& .fc-timegrid-event .fc-event-title': { fontSize: '0.75rem' },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={heLocale}
          direction="rtl"
          firstDay={0} // Sunday
          headerToolbar={{
            start: 'prev,next today',
            center: 'title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'היום',
            month: t('appointments.month'),
            week: t('appointments.week'),
            day: t('appointments.today'),
          }}
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={info => setSelectedAppt(info.event.extendedProps.appointment)}
          dateClick={info => {
            setSelectedDate(info.date)
            setNewDialogOpen(true)
          }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          slotDuration="00:30:00"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </Box>

      {newDialogOpen && (
        <NewAppointmentDialog
          open={newDialogOpen}
          onClose={() => { setNewDialogOpen(false); setSelectedDate(undefined) }}
          initialDate={selectedDate}
        />
      )}

      {selectedAppt && (
        <AppointmentDetailDialog
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
        />
      )}
    </Box>
  )
}
