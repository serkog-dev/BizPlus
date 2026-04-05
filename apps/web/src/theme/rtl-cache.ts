import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'

// Create RTL emotion cache - this mirrors all MUI CSS for RTL layout
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
})
