'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import { usePathname, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'

// Third-party Imports
import classnames from 'classnames'
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
import CountryDialog from './CountryDialog'
import ViewCountryData from './ViewCountryData'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { Box, CircularProgress } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { getAllCountries, removeCountry, setPage, setPageSize } from '@/redux-store/slices/countries'
import { useRouter } from 'next/navigation'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const CountriesList = ({ invoiceData }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dispatch = useDispatch()
  const { countries, total, initialLoading, page, pageSize } = useSelector(state => state.countries)

  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [data, setData] = useState([])
  const [selectedCountry, setSelectedCountry] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialogue, setOpenViewDialogue] = useState(false)

  useEffect(() => {
    if (hydratedFromUrl) return

    const { page, size } = readParams(new URLSearchParams(searchParams?.toString() || ''))

    dispatch(setPage(page))
    dispatch(setPageSize(size))

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

    dispatch(getAllCountries({ page, pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  useEffect(() => {
    setData(countries)
  }, [countries])

  const handleAdd = () => {
    setSelectedCountry(null)
    setOpenDialog(true)
  }

  const handleDelete = row => {

    setSelectedCountry(row)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedCountry && selectedCountry._id) {
      dispatch(removeCountry(selectedCountry._id))
    }
    setConfirmOpen(false)
    setSelectedCountry(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'name',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.name ? row?.original?.name : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('region', {
        header: 'region',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.region ? row?.original?.region : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('subregion', {
        header: 'sub-region',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.subregion ? row?.original?.subregion : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('native', {
        header: 'native',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.native ? row?.original?.native : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('flag', {
        header: 'flag',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.emoji ? row?.original?.emoji : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('currency', {
        header: 'currency',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.currency ? row?.original?.currency : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('Symbol', {
        header: 'Symbol',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.currencySymbol ? row?.original?.currencySymbol : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <Tooltip title='View'>
              <IconButton
                onClick={() => {
                  setSelectedCountry(row.original)
                  setOpenViewDialogue(true)
                }}
                color='secondary'
              >
                <i className='tabler-eye' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton onClick={() => handleDelete(row.original)}>
                <i className='tabler-trash text-textSecondary' />
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Box className='flex justify-between items-center mb-5'>
        <Typography variant='h5'>Nations</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            handleAdd()
          }}
        >
          Add Country
        </Button>
      </Box>
      <Card>
        <CardContent className='flex justify-between flex-wrap items-start gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
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
        </CardContent>
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
          onPageSizeChange={size => {
            dispatch(setPageSize(size))
            dispatch(setPage(1))
          }}
        />
      </Card>
      <CountryDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editData={selectedCountry}
        countryData={invoiceData}
      />
      <ViewCountryData
        open={openViewDialogue}
        onClose={() => setOpenViewDialogue(false)}
        countryData={selectedCountry}
      />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-country'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default CountriesList
