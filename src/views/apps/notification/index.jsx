'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { getInitials } from '@/utils/getInitials'

// Third-party Imports
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

// Component Imports
// import AddCategoryDrawer from './AddCategoryDrawer'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
import { deletenotification, getAllNotification, setPage, setPageSize } from '../../../redux-store/slices/notification'
import { Box, CircularProgress, Tooltip } from '@mui/material'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import NotificationDialog from './NotificationDialog'
import ExpandableText, { getFullImageUrl } from '@/utils/commonfunctions'
import CustomAvatar from '@/@core/components/mui/Avatar'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const Notification = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    notifications = [],
    initialLoading,
    loading,
    page,
    pageSize,
    total
  } = useSelector(state => state.notification)

  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState(null)

  // ---- Start URL Hydration (added for URL sync) ----
  useEffect(() => {
    if (hydratedFromUrl) return

    const { page: p, size: s } = readParams(new URLSearchParams(searchParams?.toString() || ''))

    dispatch(setPage(p)) // Dispatch page from URL
    dispatch(setPageSize(s)) // Dispatch pageSize from URL

    setHydratedFromUrl(true) // Mark hydration done
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return

    const next = new URLSearchParams(searchParams?.toString() || '')

    next.set('page', String(page)) // Update URL page param (added for URL sync)
    next.set('size', String(pageSize)) // Update URL size param (added for URL sync)

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false }) // URL replace without reload
  }, [page, pageSize, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(getAllNotification({ page, pageSize })) // API call with redux state filters
  }, [page, pageSize, hydratedFromUrl, dispatch])

  const handleDeleteNotification = notification => {

    setNotificationToDelete(notification)
    setIsDeleteDialogOpen(true)
  }

  // Confirm Delete
  const confirmDelete = async () => {
    if (notificationToDelete?._id) {
      try {
        await dispatch(deletenotification(notificationToDelete._id)).unwrap()
        setIsDeleteDialogOpen(false)
        setNotificationToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setNotificationToDelete(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({
              avatar: getFullImageUrl(row?.original?.user?.profileImage),
              fullName: row?.original?.user?.name
            })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.user?.name || 'No Name'}
              </Typography>
              {/* <Typography variant='body2'>{row.original.name ? row.original.name : '-'}</Typography> */}
            </div>
          </div>
        )
      }),

      columnHelper.accessor('Ads', {
        header: 'Ad',
        cell: ({ row }) => <Typography>{row.original?.ad?.title || '-'}</Typography>
      }),

      columnHelper.accessor('title', {
        header: 'Title',
        cell: ({ row }) => <Typography>{row.original?.title || '-'}</Typography>
      }),

      columnHelper.accessor('message', {
        header: 'Message',
        cell: ({ row }) => <ExpandableText text={row.original?.message || '-'} lineClamp={2} maxWidth={250} />
      }),

      columnHelper.accessor('sendType', {
        header: 'Send To',
        cell: ({ row }) => <Typography>{row.original?.sendType || '-'}</Typography>
      }),

      columnHelper.accessor('_id', {
        header: () => 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className='pl-4'>
            <Tooltip title='Delete Notification'>
              <IconButton size='small' onClick={() => handleDeleteNotification(row.original)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [notifications]
  )

  const table = useReactTable({
    data: notifications,
    columns,
    manualPagination: true,
    state: { pagination: { pageIndex: page - 1, pageSize: pageSize } },
    pageCount: Math.max(1, Math.ceil((total || 0) / (pageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  return (
    <>
      <Box className='flex justify-between items-center pb-5'>
        <Typography variant='h5'>Notifications</Typography>
        <Button
          variant='contained'
          className='max-sm:is-full'
          onClick={() => {
            setEditTarget(null)
            setDialogOpen(true)
          }}
          startIcon={<i className='tabler-plus' />}
        >
          Send Notification
        </Button>
      </Box>
      <Card>
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <div className='flex max-sm:flex-col items-start sm:items-center gap-4 max-sm:is-full'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value)
                dispatch(setPageSize(newPageSize))
                dispatch(setPage(1))
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>
        </div>
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
                        {header.isPlaceholder ? null : (
                          <>
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
                          </>
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
          </div>
        )}

        <TablePaginationComponent
          table={table}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={page => dispatch(setPage(page))}
          onPageSizeChange={size => {
            dispatch(setPageSize(size)) // Redux pageSize update
            dispatch(setPage(1)) // Page reset on user pageSize change (added)
          }}
        />
      </Card>

      <NotificationDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
        }}
        mode={editTarget ? 'edit' : 'create'}
        notification={editTarget}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-notification'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />
    </>
  )
}

export default Notification
