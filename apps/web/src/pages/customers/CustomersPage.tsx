import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Alert,
  Tooltip,
  Skeleton,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'

const SOURCE_LABELS: Record<string, string> = {
  WHATSAPP: 'וואטסאפ',
  SMS: 'SMS',
  TELEGRAM: 'טלגרם',
  MANUAL: 'ידני',
  IMPORT: 'יבוא',
}

const SOURCE_COLORS: Record<string, 'success' | 'info' | 'primary' | 'default'> = {
  WHATSAPP: 'success',
  SMS: 'info',
  TELEGRAM: 'primary',
  MANUAL: 'default',
  IMPORT: 'default',
}

function CustomerFormDialog({
  open,
  onClose,
  customer,
}: {
  open: boolean
  onClose: () => void
  customer?: any
}) {
  const queryClient = useQueryClient()
  const isEdit = !!customer

  const [form, setForm] = useState({
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    notes: customer?.notes ?? '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.updateCustomer(customer.id, data) : api.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'שגיאה בשמירת לקוח')
    },
  })

  const handleSubmit = () => {
    if (!form.firstName || !form.phone) {
      setError('שם פרטי וטלפון הם שדות חובה')
      return
    }
    mutation.mutate(form)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'עריכת לקוח' : 'לקוח חדש'}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth label="שם פרטי"
              value={form.firstName}
              onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
              required autoFocus
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="שם משפחה"
              value={form.lastName}
              onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="טלפון"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              required
              placeholder="050-1234567"
              inputProps={{ dir: 'ltr' }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="אימייל"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              inputProps={{ dir: 'ltr' }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="הערות"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              multiline rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">ביטול</Button>
        <Button onClick={handleSubmit} variant="contained" loading={mutation.isPending}>
          {isEdit ? 'שמור שינויים' : 'הוסף לקוח'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function CustomerDetailDialog({
  customer,
  onClose,
  onEdit,
}: {
  customer: any
  onClose: () => void
  onEdit: () => void
}) {
  const { data } = useQuery({
    queryKey: ['customer', customer.id],
    queryFn: () => api.getCustomer(customer.id),
  })

  const detail = data?.data ?? customer

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {customer.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography fontWeight={700}>
              {customer.firstName} {customer.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" dir="ltr">
              {customer.phone}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Tooltip title="ערוך">
            <IconButton onClick={onEdit}><EditIcon /></IconButton>
          </Tooltip>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {detail.totalAppointments ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">תורים</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {(detail.totalSpent ?? 0).toLocaleString('he-IL')}₪
                </Typography>
                <Typography variant="caption" color="text.secondary">סה"כ הוצאה</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {detail.lastVisitAt
                    ? new Date(detail.lastVisitAt).toLocaleDateString('he-IL')
                    : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">ביקור אחרון</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Appointment History */}
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          היסטוריית תורים
        </Typography>
        {(detail.appointments ?? []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">אין תורים עדיין</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>תאריך</TableCell>
                  <TableCell>שירות</TableCell>
                  <TableCell>נותן שירות</TableCell>
                  <TableCell>מחיר</TableCell>
                  <TableCell>סטטוס</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.appointments.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {new Date(a.startTime).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>{a.service?.name}</TableCell>
                    <TableCell>{a.provider?.user?.firstName}</TableCell>
                    <TableCell>{a.price}₪</TableCell>
                    <TableCell>
                      <Chip
                        label={a.status}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function CustomersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any>(null)
  const [detailCustomer, setDetailCustomer] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.getCustomers({ search: search || undefined }),
  })

  const customers: any[] = data?.data?.items ?? []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('customers.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          {t('customers.newCustomer')}
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder={t('customers.searchPlaceholder')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Customers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם</TableCell>
                <TableCell>טלפון</TableCell>
                <TableCell>מקור</TableCell>
                <TableCell align="center">{t('customers.totalAppointments')}</TableCell>
                <TableCell align="center">{t('customers.totalSpent')}</TableCell>
                <TableCell>{t('customers.lastVisit')}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : customers.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? 'לא נמצאו תוצאות' : t('customers.noCustomers')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : customers.map((c: any) => (
                  <TableRow
                    key={c.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setDetailCustomer(c)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', fontSize: 13 }}>
                          {c.firstName?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {c.firstName} {c.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" dir="ltr">{c.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={SOURCE_LABELS[c.source] ?? c.source}
                        size="small"
                        color={SOURCE_COLORS[c.source] ?? 'default'}
                        variant="outlined"
                        icon={c.source === 'WHATSAPP' ? <WhatsAppIcon style={{ fontSize: 14 }} /> : undefined}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {c.totalAppointments ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {(c.totalSpent ?? 0).toLocaleString('he-IL')}₪
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {c.lastVisitAt
                          ? new Date(c.lastVisitAt).toLocaleDateString('he-IL')
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="שלח וואטסאפ">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => window.open(`https://wa.me/${c.phone?.replace(/\D/g, '')}`, '_blank')}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="התקשר">
                          <IconButton
                            size="small"
                            onClick={() => window.open(`tel:${c.phone}`, '_self')}
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ערוך">
                          <IconButton
                            size="small"
                            onClick={() => { setEditCustomer(c); setFormOpen(true) }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {formOpen && (
        <CustomerFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditCustomer(null) }}
          customer={editCustomer}
        />
      )}

      {detailCustomer && (
        <CustomerDetailDialog
          customer={detailCustomer}
          onClose={() => setDetailCustomer(null)}
          onEdit={() => {
            setEditCustomer(detailCustomer)
            setDetailCustomer(null)
            setFormOpen(true)
          }}
        />
      )}
    </Box>
  )
}
