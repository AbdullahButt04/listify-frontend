'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import { CircularProgress, Tooltip } from '@mui/material'

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
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import RejectionDialog from '@/components/dialogs/rejection-dialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'
import ExpandableText, { formatDate, getFullImageUrl } from '@/utils/commonfunctions'
import { VERIFICATION_STATUS } from '@/utils/constants'

// Redux Imports
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchVerifications,
  approveVerification,
  rejectVerification,
  setPage,
  setPageSize,
  setDateRange
} from '@/redux-store/slices/verification'
import DateRangePicker from '@/libs/styles/DateRangePicker'
import DocumentViewDialog from './DocumentViewDialog'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => ({
  page: Number(sp.get('page')) || 1,
  size: Number(sp.get('size')) || 10,
  startDate: sp.get('startDate') || 'All',
  endDate: sp.get('endDate') || 'All',
  tab: sp.get('tab') || 'PENDING'
})

const VerificationTable = ({ status }) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { verifications, loading, page, pageSize, total, currentStatus, startDate, endDate } = useSelector(
    state => state.verification
  )

  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const [isViewProofDialog, setIisViewProofDialog] = useState(false)
  const [selectedProof, setSelectedProof] = useState({ type: '', data: '' })

  useEffect(() => {
    if (hydratedFromUrl) return
    const {
      page: p,
      size: s,
      startDate: sd,
      endDate: ed
    } = readParams(new URLSearchParams(searchParams?.toString() || ''))
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    dispatch(setDateRange({ startDate: sd, endDate: ed }))
    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return
    const next = new URLSearchParams(searchParams?.toString() || '')

    next.set('page', String(page))
    next.set('size', String(pageSize))
    next.set('startDate', startDate)
    next.set('endDate', endDate)

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [page, pageSize, startDate, endDate, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(
      fetchVerifications({
        status,
        page,
        limit: pageSize,
        startDate,
        endDate
      })
    )
  }, [status, page, pageSize, startDate, endDate, hydratedFromUrl, dispatch])

  const handleApprove = verification => {


    setSelectedVerification(verification)
    setConfirmOpen(true)
  }

  const handleReject = verification => {
    setSelectedVerification(verification)
    setRejectDialogOpen(true)
  }

  const confirmApproveAction = () => {
    if (selectedVerification && selectedVerification._id) {
      dispatch(approveVerification(selectedVerification._id))
    }
    setConfirmOpen(false)
    setSelectedVerification(null)
  }

  const confirmRejectAction = reason => {

    if (selectedVerification && selectedVerification._id) {
      dispatch(rejectVerification({ id: selectedVerification._id, reason }))
    }
    setRejectDialogOpen(false)
    setSelectedVerification(null)
  }

  const getStatusChip = status => {
    switch (status) {
      case VERIFICATION_STATUS.PENDING:
        return <Chip label='Pending' color='warning' size='small' variant='tonal' />
      case VERIFICATION_STATUS.ACCEPTED:
        return <Chip label='Approved' color='success' size='small' variant='tonal' />
      case VERIFICATION_STATUS.DECLINED:
        return <Chip label='Rejected' color='error' size='small' variant='tonal' />
      default:
        return <Chip label='Unknown' size='small' variant='tonal' />
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('uniqueId', {
        header: 'Request ID',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.uniqueId}
          </Typography>
        )
      }),
      columnHelper.accessor('user', {
        header: 'User',
        cell: ({ row }) => {
          const user = row.original.user || {}
          return (
            <div className='flex items-center gap-4'>
              {user.profileImage ? (
                <CustomAvatar src={getFullImageUrl(user.profileImage)} size={34} />
              ) : (
                <CustomAvatar size={34}>{getInitials(user.name || 'Unknown User')}</CustomAvatar>
              )}
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {user.name || 'Unknown User'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {user.profileId || 'No ID'}
                </Typography>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('idProof', {
        header: 'ID Type',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.idProof}</Typography>
      }),
      columnHelper.accessor('submittedAt', {
        header: 'Submit Time',
        cell: ({ row }) => <Typography color='text.primary'>{formatDate(row.original.submittedAt)}</Typography>
      }),
      ...(status === VERIFICATION_STATUS.ACCEPTED || status === VERIFICATION_STATUS.DECLINED
        ? [
            columnHelper.accessor('reviewedAt', {
              header: 'reviewed Time',
              cell: ({ getValue }) => <Typography color='text.primary'>{formatDate(getValue())}</Typography>
            })
          ]
        : []),
      ...(status === VERIFICATION_STATUS.DECLINED
        ? [
            columnHelper.accessor('reason', {
              header: 'Rejection Reason',
              cell: ({ row }) => (
                <>
                  <ExpandableText text={row.original.reviewerRemarks} lineClamp={3} maxWidth={250} />
                </>
              )
            })
          ]
        : []),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => getStatusChip(row.original.status)
      }),
      ...(status === VERIFICATION_STATUS.PENDING
        ? [
            columnHelper.accessor('actions', {
              header: 'Actions',
              cell: ({ row }) => (
                <div className='flex items-center gap-2'>
                  <IconButton variant='tonal' color='success' size='small' onClick={() => handleApprove(row.original)}>
                    <i className='tabler-check' />
                  </IconButton>
                  <IconButton variant='tonal' color='error' size='small' onClick={() => handleReject(row.original)}>
                    <i className='tabler-x' />
                  </IconButton>
                </div>
              ),
              enableSorting: false
            })
          ]
        : []),
      columnHelper.accessor('documents', {
        header: 'Documents',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Tooltip title='View Front Image'>
              <IconButton
                component='a'
                onClick={() => handleViewProof('Front', row.original)}
                target='_blank'
                size='small'
              >
                <i className='tabler-file' />
              </IconButton>
            </Tooltip>
            <Tooltip title='View Back Image'>
              <IconButton
                component='a'
                onClick={() => handleViewProof('Back', row.original)}
                target='_blank'
                size='small'
              >
                <i className='tabler-file' />
              </IconButton>
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ],
    [status]
  )

  const table = useReactTable({
    data: verifications[status] || [],
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

  const handleViewProof = (type, ad) => {
    setIisViewProofDialog(true)
    setSelectedProof({ type, data: ad })
  }

  return (
    <>
      <Card>
        <div className='flex justify-between flex-col items-start sm:flex-row md:items-center border-bs gap-4 p-4'>
          <Typography variant='h5'>
            {status === VERIFICATION_STATUS.PENDING
              ? 'Pending Verifications'
              : status === VERIFICATION_STATUS.ACCEPTED
                ? 'Approved Verifications'
                : 'Rejected Verifications'}
          </Typography>

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
        </div>

        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
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

        {loading ? (
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
                {table.getFilteredRowModel().rows.length === 0 && !loading ? (
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
                    {Array.from({ length: pageSize - table.getRowModel().rows.length }).map((_, index) => (
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
          onPageSizeChange={pageSize => dispatch(setPageSize(pageSize))}
        />
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='approve-verification'
        onConfirm={confirmApproveAction}
        onClose={() => setConfirmOpen(false)}
      />

      <RejectionDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={confirmRejectAction}
      />

      <DocumentViewDialog open={isViewProofDialog} onClose={setIisViewProofDialog} idProof={selectedProof} />
    </>
  )
}

export default VerificationTable
