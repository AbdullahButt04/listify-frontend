'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import TablePaginationComponent from '@components/TablePaginationComponent'

import { fetchpurchaseHistoryList, setPage, setPageSize, setDateRange } from '@/redux-store/slices/purchaseHistory'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'

import CustomTextField from '@core/components/mui/TextField'
import DateRangePicker from '@/libs/styles/DateRangePicker'
import tableStyles from '@core/styles/table.module.css'
import { getFormattedDate, getFullImageUrl } from '@/utils/commonfunctions'
import CustomAvatar from '@core/components/mui/Avatar'
import classnames from 'classnames'
import { getInitials } from '@/utils/getInitials'

const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  const startDate = sp.get('startDate') || 'All'
  const endDate = sp.get('endDate') || 'All'
  return { page, size, startDate, endDate }
}

const PurchaseHistoryTable = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const {
    purchaseHistory,
    purchaseTotalAmount,
    purchaseHistoryTotal,
    purchaseHistoryPage,
    purchaseHistoryPageSize,
    startDate,
    endDate,
    initialLoading
  } = useSelector(state => state.purchaseHistory)

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [data, setData] = useState([])

  // Step 1: Hydrate redux state from URL on page load once
  useEffect(() => {
    if (hydratedFromUrl) return

    const { page, size, startDate: sd, endDate: ed } = readParams(new URLSearchParams(searchParams?.toString() || ''))

    dispatch(setPageSize(size))
    dispatch(setPage(page))
    dispatch(setDateRange({ startDate: sd, endDate: ed }))

    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  // Step 2: URL update when redux state changes (only after hydration)
  useEffect(() => {
    if (!hydratedFromUrl) return

    const next = new URLSearchParams(searchParams?.toString() || '')

    next.set('page', String(purchaseHistoryPage))
    next.set('size', String(purchaseHistoryPageSize))

    if (startDate && startDate !== 'All') next.set('startDate', startDate)
    else next.delete('startDate')

    if (endDate && endDate !== 'All') next.set('endDate', endDate)
    else next.delete('endDate')

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [
    purchaseHistoryPage,
    purchaseHistoryPageSize,
    startDate,
    endDate,
    hydratedFromUrl,
    router,
    pathname,
    searchParams
  ])

  // Step 3: Dispatch API call when redux filters / pagination change (after hydration)
  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(fetchpurchaseHistoryList())
  }, [purchaseHistoryPage, purchaseHistoryPageSize, startDate, endDate, hydratedFromUrl, dispatch])

  // Update table data from redux store
  useEffect(() => {
    setData(purchaseHistory)
  }, [purchaseHistory])

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('user.name', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <CustomAvatar src={getFullImageUrl(row.original.user.profileImage)} size={34}>
              {getInitials(row.original.user.name)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.user.name || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('packageType', {
        header: 'Package Type',
        cell: info => <Typography color='text.primary'>{info.row.original.packageType}</Typography>
      }),
      columnHelper.accessor('packageDetails.name', {
        header: 'Package Name',
        cell: info => <Typography color='text.primary'>{info.row.original.packageDetails.name}</Typography>
      }),
      columnHelper.accessor('paymentGateway', {
        header: 'Payment Gateway',
        cell: info => <Typography color='text.primary'>{info.row.original.paymentGateway}</Typography>
      }),
      columnHelper.accessor('paidAt', {
        header: 'Paid Date',
        cell: info => <Typography color='text.primary'>{getFormattedDate(info.row.original.paidAt)}</Typography>
      }),
      columnHelper.accessor('packageDetails.finalPrice', {
        header: 'Amount',
        cell: info => <Typography color='text.primary'>{info.row.original.packageDetails.finalPrice}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    state: { pagination: { pageIndex: purchaseHistoryPage - 1, pageSize: purchaseHistoryPageSize } },
    pageCount: Math.max(1, Math.ceil((purchaseHistoryTotal || 0) / (purchaseHistoryPageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <div className='flex items-center justify-between mb-5'>
        <Typography variant='h5'>Purchase History</Typography>
        <Typography variant='h5'>Total Amount: {purchaseTotalAmount}</Typography>
      </div>
      <Card>
        <div className='flex items-center justify-between gap-8 px-6 py-4'>
          <CustomTextField
            select
            value={purchaseHistoryPageSize}
            onChange={e => {
              dispatch(setPageSize(Number(e.target.value)))
              dispatch(setPage(1))
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            {[10, 25, 50].map(size => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </CustomTextField>

          <DateRangePicker
            buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
            buttonClassName='ms-2'
            setAction={setDateRange}
            initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
            initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
            showClearButton={startDate !== 'All' && endDate !== 'All'}
            onClear={() => {
              dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
              dispatch(setPage(1))
            }}
          />
        </div>

        {initialLoading ? (
          <div className='flex items-center justify-center gap-2 grow is-full my-10'>
            <CircularProgress />
            <Typography>Loading...</Typography>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            {/* Table rendering using react-table */}
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
                  Array.from({ length: purchaseHistoryPageSize }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(purchaseHistoryPageSize / 2) ? (
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
                      length: purchaseHistoryPageSize - table.getRowModel().rows.length
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
        <TablePagination
          component={() => (
            <TablePaginationComponent
              table={table}
              page={purchaseHistoryPage}
              pageSize={purchaseHistoryPageSize}
              total={purchaseHistoryTotal}
              onPageChange={page => dispatch(setPage(page))}
              onPageSizeChange={size => dispatch(setPageSize(size))}
            />
          )}
          count={purchaseHistoryTotal}
          page={purchaseHistoryPage - 1}
          onPageChange={(_, newPage) => dispatch(setPage(newPage + 1))}
          rowsPerPage={purchaseHistoryPageSize}
          onRowsPerPageChange={e => {
            dispatch(setPageSize(Number(e.target.value)))
            dispatch(setPage(1))
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>
    </>
  )
}

export default PurchaseHistoryTable
