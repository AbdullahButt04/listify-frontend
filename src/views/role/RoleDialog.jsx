'use client'

import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Typography,
  Button,
  Box,
  Divider,
  Stack,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TextField
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { modulesConfig, NO_PERMISSION } from '@/utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { createRole, editRole } from '../../redux-store/slices/role'
import { toast } from 'react-toastify'

// Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Canonical action set (matches your backend)
const ACTIONS = ['List', 'Create', 'Edit', 'Delete']

const RoleDialog = ({ open, onClose, role = null, setRole, mode = 'Create', setMode, onSave }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  // 1) Build unique backend modules directly from modulesConfig (single source of truth)
  //    We support optional `module` or `group` on each item in modulesConfig.
  //    Fallback to normalized item.name if neither exists.
  const { uniqueModules, sections } = useMemo(() => {
    const seen = new Map() // key -> { key, name, section, icon }
    const sectionOrder = []

    Object.entries(modulesConfig).forEach(([section, items]) => {
      if (!sectionOrder.includes(section)) sectionOrder.push(section)

      items.forEach(item => {
        const key = item.name
        if (!seen.has(key)) {
          seen.set(key, {
            key, // backend module key we will send to API
            name: key, // display name (you can switch to item.module if you prefer)
            section, // assign to first section we see it in
            icon: item.icon
          })
        }
      })
    })

    return {
      uniqueModules: Array.from(seen.values()),
      sections: sectionOrder
    }
  }, [])

  // 2) State
  const emptyRow = () => ({ List: false, Create: false, Edit: false, Delete: false, Update: false })

  const buildInitial = () => {
    const base = {}
    uniqueModules.forEach(m => (base[m.key] = emptyRow()))

    // Hydrate from role.permissions in edit mode
    if (role?.permissions?.length) {
      for (const p of role.permissions) {
        const modKey = p.module // expected to match our derived keys
        if (base[modKey]) {
          const row = emptyRow()
          ;(p.actions || []).forEach(a => {
            const match = ACTIONS.find(x => x.toLowerCase() === String(a).toLowerCase())
            if (match) row[match] = true
          })
          base[modKey] = row
        }
      }
    }
    return base
  }

  const [name, setName] = useState(role?.name || '')
  const [errors, setErrors] = useState({ name: '' })
  const [loading] = useState(false) // wire to API later if needed
  const [perms, setPerms] = useState(buildInitial)

  useEffect(() => {
    setName(role?.name || '')
    setPerms(buildInitial())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, role?._id])

  // 3) UI helpers
  const enabledCount = useMemo(() => Object.values(perms).filter(p => Object.values(p).some(Boolean)).length, [perms])

  const validateName = v => {
    const s = (v || '').trim()
    if (!s) return 'Role name is required'
    if (s.length < 3) return 'Minimum 3 characters'
    if (s.length > 50) return 'Maximum 50 characters'
    return undefined
  }

  const toggleAction = (key, action) => {
    setPerms(prev => ({ ...prev, [key]: { ...prev[key], [action]: !prev[key][action] } }))
  }

  const toggleRowAll = (key, value) => {
    setPerms(prev => ({
      ...prev,
      [key]: ACTIONS.reduce((acc, a) => ((acc[a] = !!value), acc), {})
    }))
  }

  const getRowAllState = key => {
    const row = perms[key]
    const values = Object.values(row)
    const all = values.every(Boolean)
    const none = values.every(v => !v)
    return { all, indeterminate: !all && !none }
  }

  // Group rows by the section of their first appearance
  const sectionRows = useMemo(() => {
    const map = {}
    sections.forEach(section => {
      map[section] = uniqueModules.filter(m => m.section === section).map(m => m.key)
    })
    return map
  }, [sections, uniqueModules])

  const getSectionAllState = section => {
    const keys = sectionRows[section] || []
    if (!keys.length) return { all: false, indeterminate: false }
    const allRowsAll = keys.every(k => Object.values(perms[k]).every(Boolean))
    const allRowsNone = keys.every(k => Object.values(perms[k]).every(v => !v))
    return { all: allRowsAll, indeterminate: !allRowsAll && !allRowsNone }
  }

  const setSectionAll = (section, value) => {
    const keys = sectionRows[section] || []
    setPerms(prev => {
      const next = { ...prev }
      keys.forEach(k => {
        next[k] = ACTIONS.reduce((acc, a) => ((acc[a] = !!value), acc), {})
      })
      return next
    })
  }

  // 4) Build payloads
  const toPermissionsArray = state =>
    Object.entries(state)
      .map(([moduleKey, row]) => {
        const actions = ACTIONS.filter(a => row[a])
        if (!actions.length) return null
        return { module: moduleKey, actions }
      })
      .filter(Boolean)

  const diffPermissions = (oldArr, newArr) => {
    const toSet = arr => new Map(arr.map(p => [p.module, new Set((p.actions || []).map(a => String(a).toLowerCase()))]))
    const oldMap = toSet(oldArr || [])
    const newMap = toSet(newArr || [])

    const changed = []
    const allKeys = new Set([...oldMap.keys(), ...newMap.keys()])
    for (const k of allKeys) {
      const a = oldMap.get(k) || new Set()
      const b = newMap.get(k) || new Set()
      if (a.size !== b.size) {
        changed.push({ module: k, actions: Array.from(b).map(x => x.charAt(0).toUpperCase() + x.slice(1)) })
      } else {
        let same = true
        for (const x of a)
          if (!b.has(x)) {
            same = false
            break
          }
        if (!same) changed.push({ module: k, actions: Array.from(b).map(x => x.charAt(0).toUpperCase() + x.slice(1)) })
      }
    }
    return changed
  }

  const handleSave = () => {
    const nameErr = validateName(name)
    setErrors({ name: nameErr })
    if (nameErr) return



    const fullPermissions = toPermissionsArray(perms)
    const FULL_PAYLOAD = { name: name.trim(), permissions: fullPermissions }

    if (mode === 'Edit' && role) {
      // Normalize old permissions from backend for comparison
      const oldPermissions = (role.permissions || []).map(p => ({
        module: p.module,
        actions: (p.actions || []).map(a => {
          const match = ACTIONS.find(x => x.toLowerCase() === String(a).toLowerCase())
          return match || a
        })
      }))

      FULL_PAYLOAD.roleId = role._id
      dispatch(editRole(FULL_PAYLOAD))
    } else {
      dispatch(createRole(FULL_PAYLOAD))
    }

    onSave?.(FULL_PAYLOAD)
    onClose()
    setRole({})
  }

  const handleClose = () => {
    onClose()
    setRole({})
    setErrors({ name: '' })
  }

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='lg'
      PaperProps={{ sx: { overflow: 'visible', width: '650px', maxWidth: '95vw' } }}
    >
      <DialogTitle sx={{ pr: 10 }}>
        <Typography variant='h5' component='span'>
          {mode} Role
        </Typography>
        <Typography variant='body1' component='div' className='mt-2'>
          This role has access to {enabledCount} module{enabledCount === 1 ? '' : 's'} with various permission levels.
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* Role name */}
        <Box sx={{ mb: 3, mt: 3 }}>
          <TextField
            fullWidth
            label='Role Name'
            placeholder='Enter Role Name'
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
            }}
            // onBlur={e => setErrors(prev => ({ ...prev, name: validateName(e.target.value) }))}
            error={!!errors.name}
            helperText={errors.name || ' '}
            disabled={loading}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Permissions by section */}
        <Stack spacing={4}>
          {sections.map(section => {
            const rowsInSection = uniqueModules.filter(m => m.section === section)
            if (!rowsInSection.length) return null
            const { all, indeterminate } = getSectionAllState(section)

            return (
              <Box key={section}>
                <Stack
                  direction='row'
                  alignItems='center'
                  justifyContent='space-between'
                  sx={{ mb: 1.5, gap: 2, flexWrap: 'wrap' }}
                >
                  <Typography variant='h6'>{section}</Typography>
                  <Stack direction='row' alignItems='center' spacing={1.5}>
                    <Typography variant='body2'>Grant all in section</Typography>
                    <Checkbox
                      checked={all}
                      indeterminate={indeterminate}
                      onChange={(_, v) => setSectionAll(section, v)}
                      inputProps={{ 'aria-label': `Grant all in ${section}` }}
                    />
                  </Stack>
                </Stack>

                <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: 320 }}>Module</TableCell>
                        <TableCell align='center' sx={{ fontWeight: 600, width: 90 }}>
                          All
                        </TableCell>
                        {ACTIONS.map(a => (
                          <TableCell key={a} align='center' sx={{ fontWeight: 600 }}>
                            {a}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rowsInSection.map(m => {
                        const row = perms[m.key]
                        const { all: rowAll, indeterminate: rowInd } = getRowAllState(m.key)
                        return (
                          <TableRow key={m.key} hover>
                            <TableCell>
                              <Stack direction='row' alignItems='center' spacing={1.5}>
                                <i className={m.icon} />
                                <Box>
                                  <Typography fontWeight={600}>{m.name}</Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {m.key}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            {/* Row All */}
                            <TableCell align='center'>
                              <Checkbox
                                checked={rowAll}
                                indeterminate={rowInd}
                                onChange={(_, v) => toggleRowAll(m.key, v)}
                                inputProps={{ 'aria-label': `Select all for ${m.name}` }}
                              />
                            </TableCell>

                            {/* Individual actions */}
                            {ACTIONS.map(a => (
                              <TableCell key={a} align='center'>
                                <Checkbox
                                  checked={row[a]}
                                  onChange={() => toggleAction(m.key, a)}
                                  inputProps={{ 'aria-label': `${a} for ${m.name}` }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )
          })}
        </Stack>
      </DialogContent>

      <DialogActions className='p-3'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSave}>
          {mode === 'Edit' ? 'Update Role' : 'Create Role'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RoleDialog
