import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box, Paper, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Avatar, Typography, Chip, Divider, CircularProgress, Stack,
} from '@mui/material'
import {
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Telegram as TelegramIcon,
} from '@mui/icons-material'
import { apiClient } from '../../api/client'

// --- API calls ---
const fetchConversations = async (page = 1) => {
  const { data } = await apiClient.get(`/conversations?page=${page}&limit=30`)
  return data
}
const fetchMessages = async (conversationId: string) => {
  const { data } = await apiClient.get(`/conversations/${conversationId}/messages?limit=100`)
  return data
}

// --- Channel icon ---
const ChannelIcon = ({ channel }: { channel: string }) => {
  if (channel === 'WHATSAPP') return <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18 }} />
  if (channel === 'SMS') return <SmsIcon sx={{ color: '#1976d2', fontSize: 18 }} />
  if (channel === 'TELEGRAM') return <TelegramIcon sx={{ color: '#2CA5E0', fontSize: 18 }} />
  return null
}

// --- פורמט זמן ---
const formatTime = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })
}

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(),
  })

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['conversation-messages', selectedId],
    queryFn: () => fetchMessages(selectedId!),
    enabled: !!selectedId,
  })

  const conversations = convData?.data ?? []
  const messages = msgData?.messages ?? []
  const selectedConv = conversations.find((c: any) => c.id === selectedId)

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', gap: 2 }}>

      {/* עמודה שמאל — רשימת שיחות */}
      <Paper elevation={2} sx={{ width: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700}>💬 שיחות</Typography>
          <Typography variant="caption" color="text.secondary">
            {convData?.total ?? 0} שיחות סה"כ
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <WhatsAppIcon sx={{ fontSize: 48, mb: 1, color: '#25D366' }} />
            <Typography>אין שיחות עדיין</Typography>
            <Typography variant="caption">שיחות יופיעו כאן כשלקוחות יכתבו לבוט</Typography>
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', flex: 1, py: 0 }}>
            {conversations.map((conv: any, i: number) => {
              const customerName = [conv.customer?.firstName, conv.customer?.lastName]
                .filter(Boolean).join(' ') || conv.customer?.phone
              const preview = conv.lastMessage?.content?.slice(0, 50) ?? ''
              const isOut = conv.lastMessage?.direction === 'OUTBOUND'
              const isSelected = conv.id === selectedId

              return (
                <Box key={conv.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedId(conv.id)}
                      sx={{ py: 1.5, px: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 44, height: 44 }}>
                          {customerName.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={600} variant="body2">{customerName}</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <ChannelIcon channel={conv.channel} />
                              <Typography variant="caption" color="text.secondary">
                                {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {isOut ? '← ' : ''}{preview || 'אין הודעות'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {i < conversations.length - 1 && <Divider component="li" />}
                </Box>
              )
            })}
          </List>
        )}
      </Paper>

      {/* עמודה ימין — הודעות */}
      <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedId ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <WhatsAppIcon sx={{ fontSize: 64, mb: 2, color: '#25D366', opacity: 0.5 }} />
            <Typography variant="h6">בחר שיחה לצפייה</Typography>
            <Typography variant="body2">לחץ על שיחה ברשימה משמאל</Typography>
          </Box>
        ) : (
          <>
            {/* כותרת */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                {([selectedConv?.customer?.firstName, selectedConv?.customer?.lastName].filter(Boolean).join(' ') || '?').charAt(0)}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>
                  {[selectedConv?.customer?.firstName, selectedConv?.customer?.lastName].filter(Boolean).join(' ') || 'לקוח'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ChannelIcon channel={selectedConv?.channel ?? ''} />
                  <Typography variant="caption" color="text.secondary">
                    {selectedConv?.customer?.phone}
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* הודעות */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {msgLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                  <Typography>אין הודעות בשיחה זו</Typography>
                </Box>
              ) : (
                messages.map((msg: any) => {
                  const isInbound = msg.direction === 'INBOUND'
                  return (
                    <Box
                      key={msg.id}
                      sx={{ display: 'flex', justifyContent: isInbound ? 'flex-end' : 'flex-start' }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          bgcolor: isInbound ? '#DCF8C6' : 'grey.100',
                          color: 'text.primary',
                          borderRadius: isInbound
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                          px: 2, py: 1,
                          boxShadow: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', direction: 'rtl' }}>
                          {msg.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', textAlign: 'left', mt: 0.5 }}
                        >
                          {formatTime(msg.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}
