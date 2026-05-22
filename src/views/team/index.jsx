'use client'

import { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Box, Button, Card, CircularProgress, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@components/TablePaginationComponent'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { deleteStaff, fetchStaff, setPage, setPageSize, toggleActiveStatus } from '../../redux-store/slices/staff'
import StaffDialog from './StaffDialog'
import StaffPasswordUpdateDialog from './StaffPasswordUpdateDialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const Team = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { staff = [], page, pageSize, initialLoading, total, loading } = useSelector(state => state.staff)

  const { profileData } = useSelector(state => state.adminSlice)



  const dispatch = useDispatch()

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState(null)

  useEffect(() => {
    if (hydratedFromUrl) return
    const { page: p, size: s } = readParams(new URLSearchParams(searchParams?.toString() || ''))
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return
    const next = new URLSearchParams(searchParams?.toString() || '')
    next.set('page', String(page))
    next.set('size', String(pageSize))
    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [page, pageSize, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(fetchStaff({ start: page, limit: pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  const handleCreateStaff = () => {
    setIsDialogOpen(true)
    setDialogMode('create')
  }

  const handleUpdateStaff = (staff, type) => {
    if (type === 'details') {
      setIsDialogOpen(true)
      setDialogMode('edit')
    } else if (type === 'password') {
      setIsPasswordDialogOpen(true)
    }
    setSelectedStaff(staff)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setIsPasswordDialogOpen(false)
  }

  const handleDeleteStaff = role => {

    setStaffToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (staffToDelete?._id) {
      try {
        dispatch(deleteStaff(staffToDelete._id))
        setIsDeleteDialogOpen(false)
        setStaffToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setStaffToDelete(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => 'Name',
        sortingFn: 'alphanumeric',
        cell: info => {
          const name = info.getValue()
          return (
            <Box className='flex items-center gap-3'>
              <Typography color='text.primary' className='font-medium'>
                {name}
              </Typography>
            </Box>
          )
        }
      }),
      columnHelper.accessor('email', {
        header: () => 'email',
        sortingFn: 'datetime',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: () => 'status',
        sortingFn: 'datetime',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onClick={() => {

              dispatch(toggleActiveStatus(row.original._id))
            }}
          />
        )
      }),
      columnHelper.accessor('_id', {
        header: () => 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Tooltip title='Edit Staff Details'>
              <IconButton size='small' onClick={() => handleUpdateStaff(row.original, 'details')}>
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit Staff Password'>
              <IconButton size='small' onClick={() => handleUpdateStaff(row.original, 'password')}>
                <i className='tabler-pencil' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete Staff'>
              <IconButton size='small' onClick={() => handleDeleteStaff(row.original)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [staff]
  )

  const table = useReactTable({
    data: staff,
    columns,
    manualPagination: true,
    state: { pagination: { pageIndex: page - 1, pageSize: pageSize } },
    pageCount: Math.max(1, Math.ceil((total || 0) / (pageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Box className='flex justify-between mb-5'>
        <Typography variant='h5'>Staff</Typography>
        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleCreateStaff}>
          Create Staff
        </Button>
      </Box>
      <Card>
        <div className='flex justify-between items-center p-6'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)
              dispatch(setPageSize(newPageSize))
              dispatch(setPage(1))
              // updateUrlPagination(1, newPageSize)
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
        </div>
        <div className='overflow-x-auto'>
          {initialLoading ? (
            <Box className='flex justify-center items-center h-64'>
              <CircularProgress />
            </Box>
          ) : (
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
                            {{
                              asc: <i className='ri-arrow-up-s-line text-xl' />,
                              desc: <i className='ri-arrow-down-s-line text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getFilteredRowModel().rows.length === 0 && !initialLoading ? (
                  Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(pageSize / 2) ? (
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
                  ))
                ) : (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                    {Array.from({
                      length: pageSize - table.getRowModel().rows.length
                    }).map((_, index) => (
                      <tr key={`empty-${index}`}>
                        {table.getVisibleFlatColumns().map(column => (
                          <td key={column.id}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
        <TablePaginationComponent
          table={table}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={page => dispatch(setPage(page))}
          onPageSizeChange={pageSize => dispatch(setPageSize(pageSize))}
        />
      </Card>

      <StaffDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        mode={dialogMode}
        staff={selectedStaff}
        loading={loading}
      />

      <StaffPasswordUpdateDialog
        open={isPasswordDialogOpen}
        onClose={handleCloseDialog}
        staff={selectedStaff}
        loading={loading}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-staff'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />
    </>
  )
}

export default Team
