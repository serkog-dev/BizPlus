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
  CardActions,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Skeleton,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  AttachMoney as PriceIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'

function ServiceFormDialog({
  open,
  onClose,
  service,
}: {
  open: boolean
  onClose: () => void
  service?: any
}) {
  const queryClient = useQueryClient()
  const isEdit = !!service

  const [form, setForm] = useState({
    name: service?.name ?? '',
    description: service?.description ?? '',
    duration: service?.duration ?? 30,
    price: service?.price ?? 0,
    bufferBefore: service?.bufferBefore ?? 0,
    bufferAfter: service?.bufferAfter ?? 0,
    category: service?.category ?? '',
    isPublic: service?.isPublic ?? true,
    isActive: service?.isActive ?? true,
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.updateService(service.id, data) : api.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'שגיאה בשמירת שירות')
    },
  })

  const handleSubmit = () => {
    if (!form.name || form.duration <= 0) {
      setError('שם שירות ומשך זמן הם שדות חובה')
      return
    }
    mutation.mutate({
      ...form,
      duration: Number(form.duration),
      price: Number(form.price),
      bufferBefore: Number(form.bufferBefore),
      bufferAfter: Number(form.bufferAfter),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'עריכת שירות' : 'שירות חדש'}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth label="שם השירות"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required autoFocus
              placeholder="תספורת גברים, פדיקור, טיפול פנים..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="תיאור (אופציונלי)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              multiline rows={2}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="משך (דקות)"
              type="number"
              value={form.duration}
              onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
              required
              inputProps={{ min: 5, step: 5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="מחיר (₪)"
              type="number"
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
              inputProps={{ min: 0, step: 5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="חוצץ לפני (דקות)"
              type="number"
              value={form.bufferBefore}
              onChange={e => setForm(p => ({ ...p, bufferBefore: Number(e.target.value) }))}
              inputProps={{ min: 0, step: 5 }}
              helperText="זמן הכנה לפני התור"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth label="חוצץ אחרי (דקות)"
              type="number"
              value={form.bufferAfter}
              onChange={e => setForm(p => ({ ...p, bufferAfter: Number(e.target.value) }))}
              inputProps={{ min: 0, step: 5 }}
              helperText="זמן ניקיון אחרי התור"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="קטגוריה"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              placeholder="שיער, עור, ציפורניים..."
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isPublic}
                  onChange={e => setForm(p => ({ ...p, isPublic: e.target.checked }))}
                  color="primary"
                />
              }
              label="מוצג ללקוחות בוואטסאפ"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label="פעיל"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">ביטול</Button>
        <Button onClick={handleSubmit} variant="contained" loading={mutation.isPending}>
          {isEdit ? 'שמור שינויים' : 'הוסף שירות'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  service,
  onClose,
}: {
  service: any
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => api.deleteService(service.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      onClose()
    },
  })

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>מחיקת שירות</DialogTitle>
      <DialogContent>
        <Typography>
          האם למחוק את השירות <strong>{service.name}</strong>?
          <br />
          <Typography variant="caption" color="text.secondary">
            תורים עתידיים קשורים לשירות זה לא יושפעו.
          </Typography>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">ביטול</Button>
        <Button
          onClick={() => mutation.mutate()}
          variant="contained"
          color="error"
          loading={mutation.isPending}
        >
          מחק
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ServicesPage() {
  const { t } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editService, setEditService] = useState<any>(null)
  const [deleteService, setDeleteService] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices,
  })

  const services: any[] = data?.data ?? []

  const grouped = services.reduce((acc: Record<string, any[]>, s: any) => {
    const cat = s.category || 'כללי'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('services.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          {t('services.newService')}
        </Button>
      </Box>

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : services.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" variant="h6" gutterBottom>
            {t('services.noServices')}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            הוסף שירותים שהעסק שלך מציע — תספורת, טיפולים, ייעוץ...
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            הוסף שירות ראשון
          </Button>
        </Box>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
              {category}
            </Typography>
            <Grid container spacing={2}>
              {items.map((service: any) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      opacity: service.isActive ? 1 : 0.6,
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: 3 },
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" fontWeight={600} fontSize={16}>
                          {service.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!service.isActive && (
                            <Chip label="לא פעיל" size="small" color="default" />
                          )}
                          {service.isPublic && (
                            <Chip label="וואטסאפ" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </Box>

                      {service.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {service.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={500}>
                            {service.duration} דק'
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PriceIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {Number(service.price).toLocaleString('he-IL')}₪
                          </Typography>
                        </Box>
                      </Box>

                      {(service.bufferBefore > 0 || service.bufferAfter > 0) && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          חוצץ: {service.bufferBefore > 0 ? `${service.bufferBefore} דק' לפני` : ''}
                          {service.bufferBefore > 0 && service.bufferAfter > 0 ? ' + ' : ''}
                          {service.bufferAfter > 0 ? `${service.bufferAfter} דק' אחרי` : ''}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                      <Tooltip title="ערוך">
                        <IconButton
                          size="small"
                          onClick={() => { setEditService(service); setFormOpen(true) }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="מחק">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteService(service)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {formOpen && (
        <ServiceFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditService(null) }}
          service={editService}
        />
      )}

      {deleteService && (
        <DeleteConfirmDialog
          service={deleteService}
          onClose={() => setDeleteService(null)}
        />
      )}
    </Box>
  )
}
