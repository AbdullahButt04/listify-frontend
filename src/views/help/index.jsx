'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

import { useDispatch, useSelector } from 'react-redux'
import { deleteFaqs, fetchFaqs } from '@/redux-store/slices/help'
import { Box, CircularProgress, Tooltip } from '@mui/material'
import HelpDialog from './HelpDialogue'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Help = () => {
  const dispatch = useDispatch()
  const { faqs, initialLoading } = useSelector(state => state.help)

  const { profileData } = useSelector(state => state.adminSlice)



  const [selectedFaqs, setSelectedFaqs] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchFaqs())
  }, [])

  const handleAdd = () => {
    setSelectedFaqs(null)
    setOpenDialog(true)
  }

  const handleEdit = Faqs => {
    setSelectedFaqs(Faqs)
    setOpenDialog(true)
  }

  const handleDelete = faqs => {

    setSelectedFaqs(faqs)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedFaqs && selectedFaqs._id) {
      dispatch(deleteFaqs(selectedFaqs._id))
    }
    setConfirmOpen(false)
    setSelectedFaqs(null)
  }

  return (
    <>
      <div className='flex items-center justify-between gap-2 mb-5'>
        <Typography variant='h5'>Help Center</Typography>
        <div className='flex flex-wrap gap-4'>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              // if (!permission) return toast.error('You are not authorized')
              handleAdd()
            }}
          >
            Add FAQs
          </Button>
        </div>
      </div>

      {initialLoading && faqs.length === 0 && (
        <div className='h-full flex justify-center items-center mx-auto'>
          <CircularProgress />
        </div>
      )}

      {faqs.length === 0 && !initialLoading && (
        <Box className='h-full flex justify-center items-center mx-auto'>
          <Typography variant='h5'>No Questions Found</Typography>
        </Box>
      )}

      {faqs.map((items, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<i className='tabler-chevron-right' />} aria-controls='panel1a-content'>
            <Typography variant='body1'>{items.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{items.answer}</Typography>
            <div className='flex items-center justify-end'>
              <Tooltip title='Edit'>
                <IconButton
                  onClick={() => {
                    // if (!permission) return toast.error('You are not authorized')
                    handleEdit(items)
                  }}
                  size='small'
                >
                  <i className='tabler-edit text-[18px]' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete'>
                <IconButton
                  onClick={() => {
                    // if (!permission) return toast.error('You are not authorized')
                    handleDelete(items)
                  }}
                  color='error'
                  size='small'
                >
                  <i className='tabler-trash text-[18px]' />
                </IconButton>
              </Tooltip>
            </div>
          </AccordionDetails>
        </Accordion>
      ))}

      <HelpDialog open={openDialog} onClose={() => setOpenDialog(false)} editData={selectedFaqs} />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-FAQs'
        onConfirm={confirmDeleteAction} // note here
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default Help
