'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import Grid from '@mui/material/Grid2'

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
import PermissionDialog from '@components/dialogs/permission-dialog'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTabList from '@core/components/mui/TabList'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteReport,
  getReportByStatus,
  setDateRange,
  setReportPage,
  setReportPageSize,
  solveReport
} from '@/redux-store/slices/report'
import ExpandableText, { getFormattedDate, getFullImageUrl } from '@/utils/commonfunctions'
import CustomAvatar from '@/@core/components/mui/Avatar'
import { Box, CircularProgress, IconButton as MuiIconButton } from '@mui/material'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import DateRangePicker from '@/libs/styles/DateRangePicker'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const columnHelper = createColumnHelper()

// ---- URL helpers ----
const toInt = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const validTab = (v, fallback) => (v === '1' || v === '2' ? v : fallback)
const validType = (v, fallback) => (v === '1' || v === '2' ? v : fallback)

const readParams = sp => {
  const status = validTab(sp.get('status'), '1') // '1' Pending, '2' Solved
  const type = validType(sp.get('type'), '1') // '1' AD, '2' USER
  const page = toInt(sp.get('page'), 1)
  const size = toInt(sp.get('size'), 10)
  // Dates: keep your current 'All' sentinel if not provided
  const startDate = sp.get('startDate') || 'All'
  const endDate = sp.get('endDate') || 'All'
  return { status, type, page, size, startDate, endDate }
}

const writeParams = ({ sp, pathname, router, status, type, page, size, startDate, endDate }) => {
  const next = new URLSearchParams(sp.toString())

  next.set('status', status)
  next.set('type', type)
  next.set('page', String(page))
  next.set('size', String(size))

  // Only include dates if they're not 'All' (keeps URL clean)
  if (startDate && startDate !== 'All') next.set('startDate', startDate)
  else next.delete('startDate')

  if (endDate && endDate !== 'All') next.set('endDate', endDate)
  else next.delete('endDate')

  const qs = next.toString()
  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
}

const Reports = () => {
  const dispatch = useDispatch()

  const { reports, initialLoading, reportPage, reportPageSize, reportTotal, startDate, endDate, loading } = useSelector(
    state => state.report
  )

  const { profileData } = useSelector(state => state.adminSlice)



  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)

  // States
  const [globalFilter, setGlobalFilter] = useState('')

  const [reportType, setReportType] = useState('1')
  const [activeTab, setActiveTab] = useState('1')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSolveDialogOpen, setIsSolveDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  // Hydrate state from URL on first render
  useEffect(() => {
    if (hydratedFromUrl) return

    const {
      status,
      type,
      page,
      size,
      startDate: sd,
      endDate: ed
    } = readParams(new URLSearchParams(searchParams?.toString() || ''))

    // Set local tab/type
    setActiveTab(status)
    setReportType(type)

    // Sync Redux pagination + dates
    dispatch(setReportPageSize(size))
    dispatch(setReportPage(page))
    dispatch(setDateRange({ startDate: sd, endDate: ed }))

    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl])

  useEffect(() => {
    if (!hydratedFromUrl) return
    writeParams({
      sp: new URLSearchParams(searchParams?.toString() || ''),
      pathname,
      router,
      status: activeTab,
      type: reportType,
      page: reportPage,
      size: reportPageSize,
      startDate,
      endDate
    })
  }, [activeTab, reportType, reportPage, reportPageSize, startDate, endDate, hydratedFromUrl])

  useEffect(() => {
    dispatch(
      getReportByStatus({
        status: Number(activeTab),
        reportType: Number(reportType),
        start: reportPage,
        limit: reportPageSize,
        startDate,
        endDate
      })
    )
  }, [activeTab, reportType, reportPage, reportPageSize, startDate, endDate])

  // Tab change handlers
  const handleReportTypeChange = (_event, value) => {
    setReportType(value)
    setActiveTab('1')
    dispatch(setReportPage(1))
  }

  const handleStatusChange = (_event, value) => {
    setActiveTab(value)
    dispatch(setReportPage(1))
  }

  const getAvatar = ({ avatar, fullName }) => {
    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else if (fullName) {
      const initials = fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
      return <CustomAvatar size={34}>{initials}</CustomAvatar>
    } else {
      return <CustomAvatar size={34}>?</CustomAvatar>
    }
  }

  const adColumns = [
    columnHelper.accessor('user.name', {
      header: 'User',
      cell: info => {
        const user = info.row.original.user
        return (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(user?.profileImage), fullName: user?.name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {user?.name || '-'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('ad.title', {
      header: 'Ad Title',
      cell: info => {
        const ad = info.row.original.ad
        return (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(ad?.primaryImage), fullName: ad?.title })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {ad?.title || '-'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('ad.subTitle', {
      header: 'Sub Title',
      cell: info => (
        <Typography className='capitalize' color='text.primary'>
          {info.row.original.ad?.subTitle || '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('ad.description', {
      header: 'Description',
      cell: info => <ExpandableText text={info.row.original.ad?.description || '-'} lineClamp={2} maxWidth={200} />
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created Date',
      cell: info => (
        <Typography className='capitalize' color='text.primary'>
          {getFormattedDate(info.row.original.createdAt)}
        </Typography>
      )
    }),
    columnHelper.display({
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          {activeTab === '1' && (
            <MuiIconButton size='small' title='Mark as Solved' onClick={() => solveHandler(row)}>
              <i className='tabler-check' />
            </MuiIconButton>
          )}

          <MuiIconButton size='small' title='Delete' onClick={() => deletionHandler(row)}>
            <i className='tabler-trash text-textSecondary' />
          </MuiIconButton>
        </div>
      ),
      enableSorting: false
    })
  ]

  const userColumns = [
    columnHelper.accessor('user.name', {
      header: 'User',
      cell: info => {
        const user = info.row.original.user
        return (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(user?.profileImage), fullName: user?.name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {user?.name || '-'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('ad.title', {
      header: 'Ad Title',
      cell: info => {
        const ad = info.row.original.ad
        return (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(ad?.primaryImage), fullName: ad?.title })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {ad?.title || '-'}
              </Typography>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('ad.subTitle', {
      header: 'Sub Title',
      cell: info => (
        <Typography className='capitalize' color='text.primary'>
          {info.row.original.ad?.subTitle || '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('ad.description', {
      header: 'Description',
      cell: info => <ExpandableText text={info.row.original.ad?.description || '-'} lineClamp={2} maxWidth={200} />
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created Date',
      cell: info => (
        <Typography className='capitalize' color='text.primary'>
          {getFormattedDate(info.row.original.createdAt)}
        </Typography>
      )
    }),
    columnHelper.display({
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          {activeTab === '1' && (
            <MuiIconButton size='small' title='Mark as Solved' onClick={() => solveHandler(row)}>
              <i className='tabler-check' />
            </MuiIconButton>
          )}

          <MuiIconButton size='small' title='Delete' onClick={() => deletionHandler(row)}>
            <i className='tabler-trash text-textSecondary' />
          </MuiIconButton>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Choose columns based on current reportType
  const columns = useMemo(() => {
    return reportType === '1' ? adColumns : userColumns
  }, [reportType, activeTab])

  // Setup react-table
  const table = useReactTable({
    data: reports || [],
    columns,
    manualPagination: true,
    state: { pagination: { pageIndex: reportPage - 1, pageSize: reportPageSize } },
    pageCount: Math.max(1, Math.ceil((reportTotal || 0) / (reportPageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const deletionHandler = report => {

    setIsDeleteDialogOpen(true)
    setSelectedReport(report)
  }

  const solveHandler = report => {
    setIsSolveDialogOpen(true)
    setSelectedReport(report)
  }

  const confirmDelete = async () => {
    if (selectedReport?._id) {
      try {
        await dispatch(deleteReport(selectedReport._id)).unwrap()
        setIsDeleteDialogOpen(false)
        setSelectedReport(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const confirmSolve = async () => {

    if (selectedReport?._id) {
      try {
        await dispatch(solveReport(selectedReport._id)).unwrap()
        setIsSolveDialogOpen(false)
        setSelectedReport(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setSelectedReport(null)
  }

  const cancelSolve = () => {
    setIsSolveDialogOpen(false)
    setSelectedReport(null)
  }

  return (
    <>
      <Box className='mb-4 flex justify-between items-center'>
        <Typography variant='h5'>Report</Typography>
        <DateRangePicker
          buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
          buttonClassName='ms-2'
          setAction={setDateRange}
          initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
          initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
          showClearButton={startDate !== 'All' && endDate !== 'All'}
          onClear={() => dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))}
          onChange={range => dispatch(setDateRange(range))} // jab user date select kare toh ye run hoga
        />
      </Box>
      <Grid size={{ xs: 12 }} className=' mb-4 flex justify-between items-center'>
        <TabContext value={reportType}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <CustomTabList onChange={handleReportTypeChange} variant='scrollable' pill='true'>
                <Tab value='1' label='AD' icon={<i className='tabler-ad' />} iconPosition='start' />
                <Tab value='2' label='USER' icon={<i className='tabler-report' />} iconPosition='start' />
              </CustomTabList>
            </Grid>
          </Grid>
        </TabContext>

        <TabContext value={activeTab}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <CustomTabList onChange={handleStatusChange} variant='scrollable' pill='true'>
                <Tab value='1' label='Pending' />
                <Tab value='2' label='Solved' />
              </CustomTabList>
            </Grid>
          </Grid>
        </TabContext>
      </Grid>

      <Card>
        <CardContent className='flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between flex-wrap'>
          <div className='flex items-center gap-2'>
            <CustomTextField
              select
              value={reportPageSize}
              onChange={e => {
                dispatch(setReportPageSize(Number(e.target.value)))
              }}
              className='is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>
        </CardContent>

        {/* Loading Spinner */}
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
                {table.getFilteredRowModel().rows.length === 0 && !initialLoading ? (
                  Array.from({ length: reportPageSize }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(reportPageSize / 2) ? (
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
                      length: reportPageSize - table.getRowModel().rows.length
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

        {/* Pagination */}
        <TablePagination
          component={() => (
            <TablePaginationComponent
              table={table}
              page={reportPage}
              pageSize={reportPageSize}
              total={reportTotal}
              onPageChange={page => dispatch(setReportPage(page))}
              onPageSizeChange={size => dispatch(setReportPageSize(size))}
            />
          )}
          count={reportTotal}
          page={reportPage - 1} // zero based index
          onPageChange={(_, newPage) => dispatch(setReportPage(newPage + 1))}
          rowsPerPage={reportPageSize}
          onRowsPerPageChange={e => {
            dispatch(setReportPageSize(Number(e.target.value)))
            dispatch(setReportPage(1))
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-report'
        loading={loading}
      />

      <ConfirmationDialog
        open={isSolveDialogOpen}
        setOpen={setIsSolveDialogOpen}
        onClose={cancelSolve}
        onConfirm={confirmSolve}
        type='solve-report'
        loading={loading}
      />
    </>
  )
}

export default Reports
