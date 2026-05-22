'use client'

import { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Switch,
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

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
import { fallbackImg, getFullImageUrl } from '@/utils/commonfunctions'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

import { deleteRole, fetchRoles, setPage, setPageSize, toggleActiveStatus } from '../../redux-store/slices/role'
import { formatDate } from '../../utils/commonfunctions'
import PermissionShowDialog from './PermissionShowDialog'
import RoleDialog from './RoleDialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const Roles = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { role, page, pageSize, total, initialLoading, loading } = useSelector(state => state.role)

  const { profileData } = useSelector(state => state.adminSlice)



  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)

  const [isPermissionShow, setIsPermissionShow] = useState(false)
  const [selectedRole, setSelectedRole] = useState({})

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('Create')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)

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
    dispatch(fetchRoles({ start: page, limit: pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  const handleDeleteRole = role => {

    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (roleToDelete?._id) {
      try {
        await dispatch(deleteRole(roleToDelete._id))
        setIsDeleteDialogOpen(false)
        setRoleToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setRoleToDelete(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => 'Name',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: () => 'Created',
        sortingFn: 'datetime',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {formatDate(getValue())}
          </Typography>
        )
      }),
      columnHelper.accessor('updatedAt', {
        header: () => 'Updated',
        sortingFn: 'datetime',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {formatDate(getValue())}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: () => 'status',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive}
            onChange={() => {

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
            <Tooltip title='View Role'>
              <IconButton
                size='small'
                onClick={() => {
                  setIsPermissionShow(true)
                  setSelectedRole(row.original)
                }}
              >
                <i className='tabler-eye' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit Role'>
              <IconButton
                size='small'
                onClick={() => {
                  setIsRoleDialogOpen(true)
                  setDialogMode('Edit')
                  setSelectedRole(row.original)
                }}
              >
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete Role'>
              <IconButton size='small' onClick={() => handleDeleteRole(row.original)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [role]
  )

  const table = useReactTable({
    data: role,
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
      <Box className='flex justify-between items-center mb-5'>
        <Typography variant='h5'>Access Roles</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            setDialogMode('Create')
            setIsRoleDialogOpen(true)
          }}
        >
          Create New Role
        </Button>
      </Box>
      <Card>
        <div className='flex justify-between items-center p-4'>
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
      <PermissionShowDialog
        open={isPermissionShow}
        onClose={setIsPermissionShow}
        role={selectedRole}
        setRole={setSelectedRole}
      />

      <RoleDialog
        open={isRoleDialogOpen}
        onClose={setIsRoleDialogOpen}
        role={selectedRole}
        setRole={setSelectedRole}
        mode={dialogMode}
        setMode={setDialogMode}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-role'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />
    </>
  )
}

export default Roles
