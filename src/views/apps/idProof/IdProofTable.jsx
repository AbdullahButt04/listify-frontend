'use client'

import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { TablePagination, CircularProgress, Switch } from '@mui/material'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import { fetchIdProofList, removeIdProof, toggleProofActiveState } from '@/redux-store/slices/idProof'
import { getFormattedDate } from '@/utils/commonfunctions'
import AddIdDialogue from './AddIdDialogue'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper()

const UserListTable = () => {
  const dispatch = useDispatch()
  const { idProof, initialLoading } = useSelector(state => state.idProof)

  const { profileData } = useSelector(state => state.adminSlice)



  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedIdProof, setSelectedIdProof] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchIdProofList())
  }, [dispatch])

  useEffect(() => {
    setData(idProof)
  }, [idProof])

  const handleAdd = () => {
    setSelectedIdProof(null)
    setOpenDialog(true)
  }

  const handleEdit = proof => {
    setSelectedIdProof(proof)
    setOpenDialog(true)
  }

  const handleToggleStatus = Id => {

    dispatch(toggleProofActiveState(Id))
  }

  const handleDelete = proof => {

    setSelectedIdProof(proof)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedIdProof && selectedIdProof._id) {
      dispatch(removeIdProof(selectedIdProof._id))
    }
    setConfirmOpen(false)
    setSelectedIdProof(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.title}
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {getFormattedDate(row.original.createdAt)}
          </Typography>
        )
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Updated Date',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {getFormattedDate(row.original.updatedAt)}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <Switch checked={row.original.isActive} onChange={() => handleToggleStatus(row.original._id)} size='small' />
        ),
        enableSorting: true
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handleEdit(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original)}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [idProof]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <div className='flex flex-wrap items-center justify-between mb-5'>
        <Typography variant='h5' className='font-medium'>
          ID Proof List
        </Typography>
        {/* <CardHeader title='ID Proof' /> */}
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={handleAdd}
          className='max-sm:is-full'
        >
          Add ID
        </Button>
      </div>

      <Card>
        {initialLoading ? (
          <div className='flex items-center justify-center gap-2 grow is-full my-10'>
            <CircularProgress />
            <Typography>Loading...</Typography>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {!header.isPlaceholder && (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(10 / 2) ? (
                        <td
                          colSpan={table.getVisibleFlatColumns().length}
                          className='text-center py-4 text-gray-500 font-medium whitespace-nowrap'
                        >
                          No data available
                        </td>
                      ) : (
                        table.getVisibleFlatColumns().map(column => <td key={column.id}>&nbsp;</td>)
                      )}
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
      </Card>

      <AddIdDialogue open={openDialog} onClose={() => setOpenDialog(false)} editData={selectedIdProof} />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-id-proof'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default UserListTable
