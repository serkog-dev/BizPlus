import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Typography, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Skeleton, IconButton, Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material'
import { api } from '../../api/client'

const STATUS_COLOR: Record<string, any> = {
  TRIAL: 'warning', ACTIVE: 'success', PAST_DUE: 'error',
  CANCELLED: 'default', SUSPENDED: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  TRIAL: 'ניסיון', ACTIVE: 'פעיל', PAST_DUE: 'חוב',
  CANCELLED: 'בוטל', SUSPENDED: 'מושהה',
}
const PLAN_LABEL: Record<string, string> = {
  BASIC: 'בייסיק', PROFESSIONAL: 'פרופשיונל', ENTERPRISE: 'אנטרפרייז',
}

export default function TenantsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants', search, statusFilter],
    queryFn: () => api.getTenants({
      search: search || undefined,
      status: statusFilter || undefined,
      limit: 50,
    }),
  })

  const tenants: any[] = data?.data?.data?.items ?? []

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>ניהול עסקים</Typography>
        <Typography variant="body2" color="text.secondary">
          כל העסקים הרשומים ב-BizPlus
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="חפש לפי שם עסק..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>סטטוס</InputLabel>
          <Select value={statusFilter} label="סטטוס" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="TRIAL">ניסיון</MenuItem>
            <MenuItem value="ACTIVE">פעיל</MenuItem>
            <MenuItem value="PAST_DUE">חוב</MenuItem>
            <MenuItem value="CANCELLED">בוטל</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>עסק</TableCell>
                <TableCell>תוכנית</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell align="center">תורים</TableCell>
                <TableCell align="center">לקוחות</TableCell>
                <TableCell>תאריך הצטרפות</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
                : tenants.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {search ? 'לא נמצאו תוצאות' : 'אין עסקים עדיין'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : tenants.map((t: any) => (
                  <TableRow
                    key={t.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tenants/${t.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', fontSize: 14, fontWeight: 700 }}>
                          {t.name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{t.slug}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {PLAN_LABEL[t.subscription?.plan] ?? t.subscription?.plan ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[t.subscription?.status] ?? t.subscription?.status ?? '—'}
                        color={STATUS_COLOR[t.subscription?.status] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500}>
                        {t._count?.appointments ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500}>
                        {t._count?.customers ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(t.createdAt).toLocaleDateString('he-IL')}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Tooltip title="פרטים">
                        <IconButton size="small" onClick={() => navigate(`/tenants/${t.id}`)}>
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}
