'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'

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
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { Box, Button, CircularProgress, Tooltip } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { getAllCities, getAllCitiesList, removeCity, setPage, setPageSize } from '@/redux-store/slices/cities'
import { getAllStatesList } from '@/redux-store/slices/states'
import { getFormattedDate } from '@/utils/commonfunctions'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import CityDialogue from './CityDialogue'
import ViewCityDialogue from './ViewCityDialogue'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Styled Components
const Icon = styled('i')({})

// Column Definitions
const columnHelper = createColumnHelper()

// URL se page aur size read karne ki utility
const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const Cities = ({ invoiceData }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dispatch = useDispatch()
  const { cities, citiesList, page, pageSize, total, initialLoading } = useSelector(state => state.cities)
  const { statesList } = useSelector(state => state.states)
  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [data, setData] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialogue, setOpenViewDialogue] = useState(false)

  useEffect(() => {
    dispatch(getAllStatesList())
    dispatch(getAllCitiesList())
  }, [dispatch])

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
    dispatch(getAllCities({ page, pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  useEffect(() => {
    setData(cities)
  }, [cities])

  const handleDelete = row => {

    setSelectedCity(row)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedCity && selectedCity._id) {
      dispatch(removeCity(selectedCity._id))
    }
    setConfirmOpen(false)
    setSelectedCity(null)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'name',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.name ? row.original.name : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('state', {
        header: 'state',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.state_id?.name ? row?.original?.state_id?.name : '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('createdAt', {
        header: 'created date',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {getFormattedDate(row?.original?.createdAt ? row?.original?.createdAt : '')}
          </Typography>
        )
      }),

      columnHelper.accessor('updatedAt', {
        header: 'updated date',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {getFormattedDate(row?.original?.updatedAt ? row?.original?.updatedAt : '')}
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
                  setSelectedCity(row.original)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Typography variant='h5'>Cities</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            setOpenDialog(true)
          }}
        >
          Add City
        </Button>
      </Box>
      <Card>
        <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
          <div className='flex items-center gap-2'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newSize = Number(e.target.value)
                dispatch(setPageSize(newSize))
                dispatch(setPage(1)) // page reset on pageSize change by user
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
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

      <CityDialogue
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        countryData={invoiceData}
        citiesData={citiesList}
        states={statesList}
      />
      <ViewCityDialogue open={openViewDialogue} onClose={() => setOpenViewDialogue(false)} cityData={selectedCity} />

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-city'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default Cities
