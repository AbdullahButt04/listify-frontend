'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { Avatar, Box, Button, CircularProgress, Switch, Tooltip } from '@mui/material'
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

// Util Imports
import { getFullImageUrl } from '@/utils/commonfunctions'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBannerList, removeBanner, toggleBannerActiveState } from '@/redux-store/slices/banner'
import BannerDialog from '@/views/apps/banner/BannerDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const columnHelper = createColumnHelper()

const RolesTable = ({ tableData }) => {
  const dispatch = useDispatch()
  const { banners, initialLoading } = useSelector(state => state.banner)

  const { profileData } = useSelector(state => state.adminSlice)



  // Other states
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState(null)
  const [data, setData] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchBannerList())
  }, [dispatch])

  useEffect(() => {
    setData(banners)
  }, [banners])

  const handleAdd = () => {
    setSelectedBanner(null)
    setOpenDialog(true)
  }

  const handleEdit = banner => {
    setSelectedBanner(banner)
    setOpenDialog(true)
  }

  const handleDelete = banner => {

    setSelectedBanner(banner)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedBanner && selectedBanner._id) {
      dispatch(removeBanner(selectedBanner._id))
    }
    setConfirmOpen(false)
    setSelectedBanner(null)
  }

  const handleToggleStatus = bannerId => {

    dispatch(toggleBannerActiveState(bannerId))
  }

  const handleDialogSuccess = () => {
    dispatch(fetchBannerList())
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('imageUrl', {
        header: 'Image',
        cell: ({ row }) => (
          <Avatar
            src={getFullImageUrl(row.original.image)}
            alt='Banner'
            sx={{ width: 60, height: 60, borderRadius: 1 }}
            variant='rounded'
          />
        ),
        enableSorting: false
      }),
      columnHelper.accessor('redirectUrl', {
        header: 'Redirect URL',
        cell: ({ row }) => (
          <Typography
            color='text.primary'
            className='font-medium'
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <Link href={row.original.redirectUrl} target='_blank'>
              {row.original.redirectUrl === '' ? '-' : row.original.redirectUrl}
            </Link>
          </Typography>
        ),
        enableSorting: true
      }),

      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {new Date(row.original.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : '-'}
          </Typography>
        ),
        enableSorting: true
      }),

      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Switch
              checked={row.original.isActive}
              onChange={() => handleToggleStatus(row.original._id)}
              size='small'
            />
          </div>
        ),
        enableSorting: true
      }),

      columnHelper.accessor('action', {
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center gap-1'>
            <Tooltip title='Edit'>
              <IconButton
                onClick={() => {
                  handleEdit(row.original)
                }}
              >
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                onClick={() => {
                  handleDelete(row.original)
                }}
                color='error'
              >
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ],
    [data]
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
      <Box>
        <Box className='flex justify-between items-center mb-5'>
          <Typography variant='h5'>Banner</Typography>

          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleAdd}>
            Add Banner
          </Button>
        </Box>

        <Card>
          {initialLoading ? (
            <div className='flex items-center justify-center gap-2 grow is-full my-10'>
              <CircularProgress />
              <Typography>Loading...</Typography>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className={`${tableStyles.table} border-bs-none`}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>
                          {header.isPlaceholder ? null : (
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
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                        No data available
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
            </div>
          )}
        </Card>
      </Box>

      <BannerDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editData={selectedBanner}
        onSuccess={handleDialogSuccess}
      />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-banner'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default RolesTable
