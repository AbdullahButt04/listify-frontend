'use client'

import { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLiveAds, setPage, setPageSize, toggleActiveStatus } from '../../redux-store/slices/liveAds'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Switch,
  Tooltip,
  Typography
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'

import classnames from 'classnames'
import {
  createColumnHelper,
  useReactTable,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import { fallbackImg, getFormattedDate, getFullImageUrl } from '@/utils/commonfunctions'
import TablePaginationComponent from '@components/TablePaginationComponent'
import { AD_LISTING_TYPE } from '@/utils/constants'
import { SALE_TYPE } from '../../utils/constants'
import ChangeProductStatusDialog from './ChageProductStatusDialog'

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const PendingAds = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { liveAds, loading, initialLoading, total, page, pageSize } = useSelector(state => state.liveAds)

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)

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
    dispatch(fetchLiveAds({ page, pageSize, type: 'UNDER_REVIEW' }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  const columns = useMemo(
    () => [
      // Title
      columnHelper.accessor('title', {
        header: () => 'Title',
        cell: ({ getValue, row }) => (
          <Box className='flex items-center gap-2'>
            <img
              src={getFullImageUrl(row.original.primaryImage) || fallbackImg}
              alt='Ad'
              className='w-10 h-10 object-cover'
              onError={e => {
                e.target.onerror = null
                e.target.src = fallbackImg
              }}
            />
            <Box>
              <Typography color='text.primary' className='font-medium'>
                {getValue() || '—'}
              </Typography>
              <Typography color='text.secondary' className='text-sm'>
                {row.original.subTitle || '—'}
              </Typography>
            </Box>
          </Box>
        )
      }),

      columnHelper.accessor('galleryImages', {
        header: () => 'Image Gallery',
        cell: ({ getValue }) => {
          const images = getValue() || []
          const rowLength = 4 // per row

          const rows = []
          for (let i = 0; i < images.length; i += rowLength) {
            rows.push(images.slice(i, i + rowLength))
          }

          return (
            <div>
              {rows.map((rowImgs, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', marginBottom: 2 }}>
                  {rowImgs.map((img, colIndex) => (
                    <img
                      key={colIndex}
                      src={getFullImageUrl(img) || fallbackImg}
                      alt={`Gallery ${rowIndex * rowLength + colIndex + 1}`}
                      className='w-10 h-10 object-cover mr-1'
                      onError={e => {
                        e.target.onerror = null
                        e.target.src = fallbackImg
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )
        }
      }),

      columnHelper.accessor('status', {
        header: () => 'Status',
        cell: ({ getValue }) => (
          <Box className='flex items-center gap-2'>
            <Typography color='text.primary' className='font-medium'>
              {AD_LISTING_TYPE[getValue()].toLowerCase().replaceAll('_', ' ') || '—'}
            </Typography>
          </Box>
        )
      }),
      columnHelper.accessor('country', {
        header: () => 'Country',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.location.country || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('state', {
        header: () => 'State',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.location.state || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('city', {
        header: () => 'City',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.location.city || '—'}
          </Typography>
        )
      }),

      columnHelper.accessor('saleType', {
        header: () => 'saleType',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {SALE_TYPE[getValue()].toLowerCase().replaceAll('_', ' ') || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('price', {
        header: () => 'price',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue() || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('likesCount', {
        header: () => 'likes',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue() || 0}
          </Typography>
        )
      }),
      columnHelper.accessor('viewsCount', {
        header: () => 'views',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue() || 0}
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: () => 'createdAt',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getFormattedDate(getValue()) || 0}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: () => 'Active',
        cell: ({ getValue, row }) => (
          <Switch checked={getValue()} onChange={() => dispatch(toggleActiveStatus(row.original._id))} />
        )
      }),
      columnHelper.accessor('_id', {
        header: () => 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Tooltip title='View Sub Categories'>
              <IconButton
                size='small'
                onClick={() => {
                  setOpenDialog(true)
                  setSelectedAd(row.original)
                }}
              >
                <i className='tabler-tool' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [liveAds]
  )

  const table = useReactTable({
    data: liveAds,
    columns,
    manualPagination: true,
    state: { pagination: { pageIndex: page - 1, pageSize: pageSize } },
    pageCount: Math.max(1, Math.ceil((total || 0) / (pageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Typography variant='h5' className='mb-5'>
        Pending Ads
      </Typography>

      <Card>
        <div className='flex justify-between items-center p-6'>
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

      <ChangeProductStatusDialog open={openDialog} onClose={setOpenDialog} selectedAd={selectedAd} />
    </>
  )
}

export default PendingAds
