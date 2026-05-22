import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  Button,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { toast } from 'react-toastify'
import CurrencyDialog from '../dialogs/CurrencyDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { deleteCurrency, fetchCurrencies, setDefaultCurrency } from '@/redux-store/slices/currency'
import { NO_PERMISSION } from '@/utils/constants'
// import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

const CurrencySettings = () => {
  const dispatch = useDispatch()
  const { currencies, loading, initialLoading } = useSelector(state => state.currency)

  const { profileData } = useSelector(state => state.adminSlice)



  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [mode, setMode] = useState('create')

  useEffect(() => {
    dispatch(fetchCurrencies())
  }, [dispatch])

  const handleAdd = () => {
    // if (!permission) return toast.error('You are not authorized')

    setMode('create')
    setSelectedCurrency(null)
    setDialogOpen(true)
  }

  const handleEdit = currency => {
    // if (!permission) return toast.error('You are not authorized')

    setMode('edit')
    setSelectedCurrency(currency)
    setDialogOpen(true)
  }

  const handleDelete = currency => {


    setSelectedCurrency(currency)
    setConfirmDialogOpen(true)
  }

  const handleSetDefault = async currencyId => {

    try {
      await dispatch(setDefaultCurrency(currencyId)).unwrap()
    } catch (error) {
      console.error('Failed to set default currency:', error)
    }
  }

  const confirmDeleteAction = () => {
    if (selectedCurrency && selectedCurrency._id) {
      dispatch(deleteCurrency(selectedCurrency._id))
    }
    setConfirmDialogOpen(false)
    setSelectedCurrency(null)
  }

  return (
    <Box className='flex flex-col gap-6'>
      <Box className='flex justify-between items-center'>
        <Typography variant='h5'>Currency Setting</Typography>
        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleAdd}>
          Add Currency
        </Button>
      </Box>

      {initialLoading ? (
        <Box className='flex justify-center items-center h-full'>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Name
                  </TableCell>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Symbol
                  </TableCell>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Country Code
                  </TableCell>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Currency Code
                  </TableCell>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Default
                  </TableCell>
                  <TableCell align='center' sx={{ textTransform: 'uppercase' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currencies.map(currency => (
                  <TableRow key={currency._id} hover>
                    <TableCell align='center'>{currency.name}</TableCell>
                    <TableCell align='center'>{currency.symbol}</TableCell>
                    <TableCell align='center'>{currency.countryCode}</TableCell>
                    <TableCell align='center'>{currency.currencyCode}</TableCell>
                    <TableCell align='center'>
                      <IconButton
                        color={currency.isDefault ? 'primary' : 'default'}
                        onClick={() => !currency.isDefault && handleSetDefault(currency._id)}
                        disabled={currency.isDefault}
                      >
                        <i className={currency.isDefault ? 'tabler-star-filled' : 'tabler-star'} />
                      </IconButton>
                    </TableCell>
                    <TableCell align='center'>
                      <Box className='flex justify-center gap-2'>
                        <Tooltip title='Edit'>
                          <span>
                            <IconButton color='primary' onClick={() => handleEdit(currency)}>
                              <i className='tabler-pencil' />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title='Delete'>
                          <span>
                            <IconButton
                              color='error'
                              onClick={() => handleDelete(currency)}
                              disabled={currency.isDefault}
                            >
                              <i className='tabler-trash' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!initialLoading && currencies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      <Typography color='text.secondary'>No currencies found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <CurrencyDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSelectedCurrency(null)
        }}
        mode={mode}
        currency={selectedCurrency}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        setOpen={setConfirmDialogOpen}
        type='delete-currency'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmDialogOpen(false)}
      />
    </Box>
  )
}

export default CurrencySettings
