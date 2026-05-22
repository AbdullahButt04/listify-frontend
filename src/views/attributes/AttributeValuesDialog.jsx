import React, { forwardRef, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Dialog, DialogTitle, DialogContent, Slide, Typography, Box, IconButton, TextField } from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'
import tableStyles from '@core/styles/table.module.css'
import { deleteAttributeValue, fetchAttributes, modifyAttributeValue } from '@/redux-store/slices/attributes'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const columnHelper = createColumnHelper()

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AttributeValuesDialog = ({ open, handleClose, attribute = null }) => {
  const dispatch = useDispatch()
  const { attributes, page, pageSize } = useSelector(state => state.attributes)
  const { profileData } = useSelector(state => state.adminSlice)



  // State for managing edit
  const [editingIndex, setEditingIndex] = useState(null)
  const [editedValue, setEditedValue] = useState('')
  const inputRef = useRef(null)

  // Get the latest attribute data from Redux store
  const currentAttribute = useMemo(() => {
    if (!attribute?._id) return null
    return attributes?.find(attr => attr._id === attribute._id) || attribute
  }, [attributes, attribute])

  // Reset edit state when dialog closes
  useEffect(() => {
    if (!open) {
      setEditingIndex(null)
      setEditedValue('')
    }
  }, [open])

  // Reset edit state when attribute changes
  useEffect(() => {
    if (attribute?._id) {
      setEditingIndex(null)
      setEditedValue('')
    }
  }, [attribute?._id])

  const handleEditSave = useCallback(
    async index => {
      if (!currentAttribute?._id) return



      try {
        await dispatch(
          modifyAttributeValue({
            attributeId: currentAttribute._id,
            index,
            newValue: editedValue
          })
        )
          .unwrap()
          .then(() => {
            dispatch(fetchAttributes({ page, pageSize }))
          })

        setEditingIndex(null)
        setEditedValue('')
      } catch (error) {
        console.error('Failed to save attribute value:', error)
      }
    },
    [dispatch, currentAttribute, editedValue]
  )

  const handleDelete = useCallback(
    async index => {
      if (!currentAttribute?._id) return

      try {
        await dispatch(
          deleteAttributeValue({
            attributeId: currentAttribute._id,
            index
          })
        ).unwrap()
      } catch (error) {
        console.error('Failed to delete attribute value:', error)
      }
    },
    [dispatch, currentAttribute]
  )

  const handleEdit = useCallback((index, value) => {
    setEditingIndex(index)
    setEditedValue(value)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null)
    setEditedValue('')
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => <Typography className='font-medium mx-auto'>Value</Typography>,
        cell: ({ row }) =>
          editingIndex === row.index ? (
            <span className='flex items-center'>
              <TextField
                value={editedValue}
                onChange={e => setEditedValue(e.target.value)}
                variant='outlined'
                size='small'
                fullWidth
                inputRef={inputRef}
                autoFocus
              />
              <IconButton onClick={() => handleEditSave(row.index)} variant='outlined' size='small' sx={{ ml: 1 }}>
                <i className='tabler-check' />
              </IconButton>
              <IconButton onClick={handleCancelEdit} variant='outlined' size='small' sx={{ ml: 1 }}>
                <i className='tabler-x' />
              </IconButton>
            </span>
          ) : (
            <Typography color='text.primary' className='font-medium text-center'>
              {row.original}
            </Typography>
          )
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <Typography className='font-medium mx-auto text-center'>Actions</Typography>,
        enableSorting: false,
        cell: ({ row }) => (
          <Box className='flex items-center gap-2 justify-center'>
            <IconButton size='small' onClick={() => handleEdit(row.index, row.original)}>
              <i className='tabler-edit' />
            </IconButton>
            <IconButton size='small' onClick={() => handleDelete(row.index)}>
              <i className='tabler-trash' />
            </IconButton>
          </Box>
        )
      })
    ],
    [editingIndex, editedValue, handleEdit, handleEditSave, handleCancelEdit, handleDelete]
  )

  const tableData = useMemo(() => {
    return currentAttribute?.values || []
  }, [currentAttribute])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Early return after all hooks
  if (!currentAttribute) return null

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='md'
      PaperProps={{ sx: { overflow: 'visible', width: 400, maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Attribute Values
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getCanSort(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <i className='ri-arrow-up-s-line text-xl' />}
                          {header.column.getIsSorted() === 'desc' && <i className='ri-arrow-down-s-line text-xl' />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-4'>
                    No values available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default AttributeValuesDialog
