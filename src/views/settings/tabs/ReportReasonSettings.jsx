'use client'

import { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { toast } from 'react-toastify'
import ReportReasonDialog from '../dialogs/ReportReasonDialog'

// Redux Actions
import {
  createReportReason,
  deleteReportReason,
  fetchReportReasons,
  updateReportReason
  //  deleteReportReason
} from '@/redux-store/slices/reportReasons'

// Custom Components
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { NO_PERMISSION } from '@/utils/constants'

const ReportReasonSettings = () => {
  const dispatch = useDispatch()
  const { reportReasons, initialLoading, loading, error } = useSelector(state => state.reportReasons)

  const { profileData } = useSelector(state => state.adminSlice)



  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    dispatch(fetchReportReasons())
  }, [dispatch])

  // Dialog handlers
  const handleOpenDialog = (reason = null) => {
    // if (!permission) return toast.error('You are not authorized')

    setSelectedReason(reason)
    setOpenDialog(true)
  }

  const handleOpenDeleteDialog = reason => {


    setSelectedReason(reason)
    setOpenDeleteDialog(true)
  }

  // Action handlers
  const handleCreateOrUpdateReason = async data => {
    // if (!permission) return toast.error('You are not authorized')

    setActionLoading(true)
    setActionError(null)

    try {
      if (selectedReason) {
        await dispatch(updateReportReason({ reportReasonId: selectedReason._id, ...data })).unwrap()
      } else {
        await dispatch(createReportReason(data.title)).unwrap()
      }

      setOpenDialog(false)

      setSelectedReason(null)

      dispatch({ type: 'reportReasons/clearReportReasonStatus' })
    } catch (error) {
      setActionError(error.message || 'Failed to save report reason')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteReason = async () => {
    // if (!permission) return toast.error('You are not authorized')

    if (!selectedReason) return

    try {
      await dispatch(deleteReportReason(selectedReason._id)).unwrap()
    } catch (error) {
      console.error('Failed to delete report reason:', error)
    }
  }

  // Format date function
  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }

    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <>
      <Box className='flex justify-between items-center pt-2 pb-4'>
        <Typography variant='h5'>Report Reason</Typography>
        <Button variant='contained' onClick={() => handleOpenDialog()} startIcon={<i className='tabler-plus' />}>
          Add New Reason
        </Button>
      </Box>

      <Card>
        <Box className=''>
          {error && (
            <Alert severity='error' className='mb-6'>
              {error}
            </Alert>
          )}

          {initialLoading ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : !reportReasons || reportReasons.length === 0 ? (
            <Box className='text-center py-8'>
              <Typography>No report reasons found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label='report reasons table'>
                <TableHead>
                  <TableRow>
                    <TableCell className='uppercase'>Title</TableCell>
                    <TableCell className='uppercase'>Created At</TableCell>
                    <TableCell className='uppercase'>Updated At</TableCell>
                    <TableCell align='center' className='uppercase'>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportReasons.map(reason => (
                    <TableRow key={reason._id}>
                      <TableCell>{reason.title}</TableCell>
                      <TableCell>{formatDate(reason.createdAt)}</TableCell>
                      <TableCell>{formatDate(reason.updatedAt)}</TableCell>
                      <TableCell align='center'>
                        <Box className='flex justify-center'>
                          <Tooltip title='Edit'>
                            <IconButton onClick={() => handleOpenDialog(reason)}>
                              <i className='tabler-edit' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Delete'>
                            <IconButton onClick={() => handleOpenDeleteDialog(reason)}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Add/Edit Dialog (single instance) */}
          <ReportReasonDialog
            open={openDialog}
            setOpen={open => {
              setOpenDialog(open)

              if (!open) {
                setSelectedReason(null)
                setActionError(null)
                setActionLoading(false)

                dispatch({ type: 'reportReasons/clearReportReasonStatus' })
              }
            }}
            reportReason={selectedReason}
            onSubmit={handleCreateOrUpdateReason}
            loading={actionLoading}
            error={actionError}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={openDeleteDialog}
            setOpen={setOpenDeleteDialog}
            type='delete-reason'
            onConfirm={handleDeleteReason}
            loading={loading}
            onClose={() => setOpenDeleteDialog(false)}
          />
        </Box>
      </Card>
    </>
  )
}

export default ReportReasonSettings
