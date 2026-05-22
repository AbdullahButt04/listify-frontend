'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

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

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
// import { fetchBannerList, removeBanner, toggleBannerActiveState } from '@/redux-store/slices/banner'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Switch,
  TablePagination,
  Tooltip
} from '@mui/material'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { fetchAllTips, removeTip, setPage, setPageSize, toggleTipActiveState } from '@/redux-store/slices/Tip'
import TipDialog from '@/views/apps/tips/TipsDialogue'
import TipDescriptionDialog from '@/views/apps/tips/TipDescriptionDialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import CustomTextField from '@/@core/components/mui/TextField'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

// Column Definitions
const columnHelper = createColumnHelper()

// Helper to parse URL params
const getPaginationParams = searchParams => {
  const page = Number(searchParams.get('page')) || 1
  const size = Number(searchParams.get('size')) || 10
  return { page, size }
}

const Tip = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { tips, initialLoading, page, pageSize, total } = useSelector(state => state.tips)

  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydrated, setHydrated] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedTip, setSelectedTip] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [openDescDialog, setOpenDescDialog] = useState(false)
  const [descToShow, setDescToShow] = useState('')

  useEffect(() => {
    if (hydrated) return
    const { page: p, size: s } = getPaginationParams(searchParams)
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setHydrated(true)
  }, [hydrated, searchParams, dispatch])

  // Step 2: On redux page or pageSize changes sync URL
  useEffect(() => {
    if (!hydrated) return

    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    params.set('size', String(pageSize))

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [page, pageSize, hydrated, router, pathname, searchParams])

  // Step 3: Fetch data on page/pageSize change
  useEffect(() => {
    if (hydrated) {
      dispatch(fetchAllTips({ page, pageSize }))
    }
  }, [page, pageSize, hydrated, dispatch])

  useEffect(() => {
    setData(tips)
  }, [tips])

  const handleAdd = () => {
    setSelectedTip(null)
    setOpenDialog(true)
  }

  const handleEdit = tip => {
    setSelectedTip(tip)
    setOpenDialog(true)
  }

  const handleDelete = tip => {

    setSelectedTip(tip)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedTip && selectedTip._id) {
      dispatch(removeTip(selectedTip._id))
    }
    setConfirmOpen(false)
    setSelectedTip(null)
  }

  const handleToggleStatus = tipId => {
    // if (!permission) return toast.error('You are not authorized')
    dispatch(toggleTipActiveState(tipId))
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: 'description',
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
            {row.original.description === '' ? '-' : row.original.description}
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
        header: 'Updated Date',
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
            <Tooltip title='View Full Description'>
              <IconButton
                onClick={() => {
                  setDescToShow(row.original.description || '-')
                  setOpenDescDialog(true)
                }}
                color='secondary'
              >
                <i className='tabler-eye' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton onClick={() => handleEdit(row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton onClick={() => handleDelete(row.original)} color='error'>
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
    data: data,
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
      <Box>
        <Box className='flex justify-between items-center mb-5'>
          <Typography variant='h5'>Tip</Typography>

          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              // if (!permission) return toast.error('You are not authorized')
              handleAdd()
            }}
          >
            Add Tip
          </Button>
        </Box>

        <Card>
          <div className='flex justify-start flex-col items-start md:flex-row md:items-center px-6 py-3 border-bs gap-4'>
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
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={p => dispatch(setPage(p))}
            onPageSizeChange={size => {
              dispatch(setPageSize(size))
              dispatch(setPage(1))
            }}
          />
        </Card>
      </Box>

      <TipDialog open={openDialog} onClose={() => setOpenDialog(false)} editData={selectedTip} />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-tip'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />

      <TipDescriptionDialog open={openDescDialog} onClose={() => setOpenDescDialog(false)} descToShow={descToShow} />
    </>
  )
}

export default Tip
