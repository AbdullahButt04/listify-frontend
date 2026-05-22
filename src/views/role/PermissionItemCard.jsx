'use client'

import React from 'react'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import CustomAvatar from '@core/components/mui/Avatar'

const getColorByAction = action => {
  const a = action.toLowerCase()
  if (a.includes('view') || a === 'read') return 'info'
  if (a.includes('create') || a.includes('add') || a.includes('write')) return 'primary'
  if (a.includes('edit') || a.includes('update')) return 'warning'
  if (a.includes('delete') || a.includes('remove')) return 'error'
  if (a.includes('export') || a.includes('download')) return 'success'
  return 'secondary'
}

// utils/getIcon.js

export const getIconByAction = (action, size = 18, color = 'inherit') => {
  let iconClass = 'ti ti-help' // default fallback

  switch (action.toLowerCase()) {
    case 'list':
      iconClass = 'tabler-list'
      break
    case 'edit':
      iconClass = 'tabler-edit'
      break
    case 'create':
      iconClass = 'tabler-plus'
      break
    case 'delete':
      iconClass = 'tabler-trash'
      break
    default:
      iconClass = 'tabler-help'
  }

  return <i className={iconClass} />
}

const PermissionItemCard = ({
  moduleName,
  actions,
  iconClassName = 'tabler-shield',
  chipIconClassName = 'tabler-eye',
  sx
}) => {
  const total = actions?.length ?? 0

  return (
    <Paper elevation={0} className='p-4 border rounded-md mb-3' sx={sx}>
      {/* Top row: avatar + name (left) | total (right) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <CustomAvatar skin='light' color='primary' variant='rounded'>
            <i className='tabler-briefcase' />
          </CustomAvatar>
          <Box>
            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
              {moduleName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Module permissions
            </Typography>
          </Box>
        </Stack>

        <Chip size='small' color='secondary' variant='tonal' label={`Total: ${total}`} sx={{ fontWeight: 600 }} />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Bottom row: action chips */}
      <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
        {actions?.map((action, idx) => (
          <Chip
            key={`${moduleName}-${action}-${idx}`}
            icon={getIconByAction(action)}
            label={action}
            variant='outlined'
            color={getColorByAction(action)}
            sx={{ textTransform: 'capitalize' }}
          />
        ))}
      </Stack>
    </Paper>
  )
}

export default PermissionItemCard
