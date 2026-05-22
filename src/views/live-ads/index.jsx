'use client'

import { useMemo, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { useDispatch, useSelector } from 'react-redux'
import {
  fetchLiveAds,
  getAllCity,
  getAllCountry,
  removeAd,
  setPage,
  setPageSize,
  toggleActiveStatus
} from '../../redux-store/slices/liveAds'
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
import CustomAvatar from '@core/components/mui/Avatar'

import tableStyles from '@core/styles/table.module.css'
import { fallbackImg, getFormattedDate, getFullImageUrl } from '@/utils/commonfunctions'
import TablePaginationComponent from '@components/TablePaginationComponent'
import { AD_LISTING_SALE_TYPE_COLOR, AD_LISTING_TYPE, AD_LISTING_TYPE_COLOR } from '@/utils/constants'
import { NO_PERMISSION, SALE_TYPE } from '../../utils/constants'
import ChangeProductStatusDialog from '../PendingAds/ChageProductStatusDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import EditDialogue from './EditDialogue'
import AuctioBidDialog from './AuctionBidDialog'
import { fetchAllUsersForFilter } from '@/redux-store/slices/adVideo'
import { toast } from 'react-toastify'

// Column Definitions
const columnHelper = createColumnHelper()

const getParam = (sp, key, fallback) => {
  const v = sp.get(key)
  return v === null ? fallback : v
}

const readParams = sp => ({
  page: Number(sp.get('page')) || 1,
  size: Number(sp.get('size')) || 10,
  sellerId: sp.get('sellerId') || 'ALL',
  type: sp.get('type') || 'ALL',
  search: sp.get('search') || '',
  country: sp.get('country') || 'ALL',
  city: sp.get('city') || 'ALL'
})

const LiveAds = () => {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    liveAds = [],
    initialLoading,
    total,
    page,
    pageSize,
    countriesForFilter,
    citiesForFilter
  } = useSelector(state => state.liveAds)

  const { allUsersForFilter } = useSelector(state => state.adVideos)

  const { profileData } = useSelector(state => state.adminSlice)



  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null) // ad object | null

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const [isAuctionDialogOpen, setIsAuctionDialogOpen] = useState(false)

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [filter, setFilter] = useState('ALL')

  const [locationFilter, setLocationFilter] = useState({ country: 'ALL', city: 'ALL' })

  const initialSearch = getParam(searchParams, 'search', '')
  const [globalFilter, setGlobalFilter] = useState(initialSearch)

  useEffect(() => {
    dispatch(fetchAllUsersForFilter())
    dispatch(getAllCountry())
    dispatch(getAllCity())
  }, [dispatch])

  useEffect(() => {
    if (hydratedFromUrl) return
    const {
      page: p,
      size: s,
      sellerId,
      type,
      search,
      country,
      city
    } = readParams(new URLSearchParams(searchParams?.toString() || ''))
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setFilter(sellerId)
    setStatusFilter(type)
    setGlobalFilter(search)
    setHydratedFromUrl(true)
    setLocationFilter({ country, city })
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return
    const next = new URLSearchParams(searchParams?.toString() || '')
    next.set('page', String(page))
    next.set('size', String(pageSize))
    next.set('sellerId', filter)
    next.set('type', statusFilter)
    next.set('search', globalFilter)
    next.set('country', locationFilter.country)
    next.set('city', locationFilter.city)
    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [
    page,
    pageSize,
    filter,
    statusFilter,
    globalFilter,
    hydratedFromUrl,
    router,
    pathname,
    searchParams,
    locationFilter
  ])

  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(
      fetchLiveAds({
        page,
        pageSize,
        sellerId: filter,
        type: statusFilter,
        search: globalFilter,
        country: locationFilter.country,
        city: locationFilter.city
      })
    )
  }, [page, pageSize, filter, statusFilter, globalFilter, hydratedFromUrl, dispatch, locationFilter])

  // Reset filters function
  const handleResetFilters = () => {
    setFilter('ALL')
    setStatusFilter('ALL')
    setGlobalFilter('')
    setLocationFilter({ country: 'ALL', city: 'ALL' })
    dispatch(setPage(1))
    dispatch(setPageSize(10))
  }

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      filter !== 'ALL' ||
      statusFilter !== 'ALL' ||
      globalFilter.trim() !== '' ||
      locationFilter.country !== 'ALL' ||
      locationFilter.city !== 'ALL'
    )
  }, [filter, statusFilter, globalFilter, locationFilter])

  const handleDelete = ad => {

    setSelectedAd(ad)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedAd && selectedAd._id) {
      dispatch(removeAd(selectedAd._id))
    }
    setConfirmOpen(false)
    setSelectedAd(null)
  }

  const handleEdit = ad => {
    setSelectedAd(ad)
    setEditDialogOpen(true)
  }

  const getAvatar = ({ avatar, fullName }) =>
    avatar ? <CustomAvatar src={avatar} size={34} /> : <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>

  const columns = useMemo(
    () => [
      // Title
      columnHelper.accessor('title', {
        header: () => 'Title',
        cell: ({ getValue, row }) => (
          <Box className='flex items-center gap-2'>
            <img
              src={getFullImageUrl(row?.original?.primaryImage) || fallbackImg}
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
        cell: ({ getValue }) => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {getValue().map((img, index) => (
              <img
                key={index}
                src={getFullImageUrl(img) || fallbackImg}
                alt={`Gallery ${index + 1}`}
                className='w-10 h-10 object-cover'
                onError={e => {
                  e.target.onerror = null
                  e.target.src = fallbackImg
                }}
              />
            )) || <span>—</span>}
          </div>
        )
      }),

      columnHelper.accessor('fullName', {
        header: 'Seller',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({
              avatar: getFullImageUrl(row?.original?.seller?.profileImage || fallbackImg),
              fullName: row?.original?.seller?.name
            })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.seller?.name || 'No Name'}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.seller?.email || 'No Email'}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.seller?.phoneNumber || 'No Number'}
              </Typography>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('status', {
        header: () => 'Status',
        cell: ({ getValue, row }) => {
          const statusValue = getValue()

          const rejectionNote = row.original.rejectionNote

          return (
            <Box className='flex items-center gap-2'>
              <Chip
                label={AD_LISTING_TYPE[statusValue].toLowerCase().replaceAll('_', ' ') || '—'}
                variant='tonal'
                color={AD_LISTING_TYPE_COLOR[statusValue]}
                size='small'
              />
              {statusValue === 4 && (
                <Tooltip title={rejectionNote} arrow placement='top'>
                  <IconButton size='small' color='warning'>
                    <i className='tabler-info-octagon' fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
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
            {row.original?.location?.city || '—'}
          </Typography>
        )
      }),

      columnHelper.accessor('saleType', {
        header: () => 'sale Type',
        cell: ({ getValue }) => (
          <Box className='flex items-center gap-2'>
            <Chip
              label={SALE_TYPE[getValue()].toLowerCase().replaceAll('_', ' ') || '—'}
              variant='tonal'
              color={AD_LISTING_SALE_TYPE_COLOR[getValue()]}
              size='small'
            />
          </Box>
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

      columnHelper.accessor('auctionStartingPrice', {
        header: () => 'auction Price',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue() || 0}
          </Typography>
        )
      }),

      columnHelper.accessor('auctionDurationDays', {
        header: () => 'auction Days',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue() || 0}
          </Typography>
        )
      }),

      columnHelper.accessor('auctionStartDate', {
        header: () => 'auction Start Date',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getFormattedDate(getValue()) || '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('auctionEndDate', {
        header: () => 'auction End Date',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getFormattedDate(getValue()) || '-'}
          </Typography>
        )
      }),

      columnHelper.accessor('createdAt', {
        header: () => 'created At',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getFormattedDate(getValue()) || '-'}
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
            <Tooltip title='Edit Category'>
              <IconButton size='small' variant='outlined' onClick={() => handleEdit(row.original)}>
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Auction Bids'>
              <Link href={`/en/live-ads/auction-bids?adId=${row.original._id}`}>
                <IconButton size='small'>
                  <i className='tabler-gavel' />
                </IconButton>
              </Link>
            </Tooltip>

            <Tooltip title='Delete Category'>
              <IconButton size='small' onClick={() => handleDelete(row.original)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>

            {row.original.status !== 2 && (
              <Tooltip title='Change Status'>
                <IconButton
                  size='small'
                  onClick={() => {
                    setStatusDialogOpen(true)
                    setSelectedAd(row.original)
                  }}
                >
                  <i className='tabler-tool' />
                </IconButton>
              </Tooltip>
            )}
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
        Ads Listing
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

          <Box className='flex gap-5'>
            <CustomTextField
              select
              value={locationFilter.country}
              onChange={e => {
                setLocationFilter({ ...locationFilter, country: e.target.value })
              }}
              className='max-sm:is-full sm:is-[200px]'
            >
              <MenuItem value='ALL'>Select Country</MenuItem>
              {countriesForFilter.map(u => (
                <MenuItem key={u._id} value={u.name}>
                  {u.name}
                </MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField
              select
              value={locationFilter.city}
              onChange={e => {
                setLocationFilter({ ...locationFilter, city: e.target.value })
              }}
              className='max-sm:is-full sm:is-[200px]'
            >
              <MenuItem value='ALL'>Select City</MenuItem>
              {citiesForFilter.map(u => (
                <MenuItem key={u._id} value={u.name}>
                  {u.name}
                </MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField
              select
              value={filter}
              onChange={e => {
                setFilter(e.target.value)
              }}
              className='max-sm:is-full sm:is-[200px]'
            >
              <MenuItem value='ALL'>Select Seller</MenuItem>
              {allUsersForFilter.map(u => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name}
                </MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField
              select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                dispatch(setPage(1))
              }}
              slotProps={{ select: { displayEmpty: true } }}
              className='max-sm:is-full sm:is-[200px]'
            >
              <MenuItem value='ALL'>All status</MenuItem>
              {Object.entries(AD_LISTING_TYPE)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([code, name]) => (
                  <MenuItem key={code} value={name}>
                    {name.toLowerCase().replaceAll('_', ' ')}
                  </MenuItem>
                ))}
            </CustomTextField>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Tooltip title='Reset filters'>
                <IconButton variant='outlined' color='primary' size='small' onClick={handleResetFilters}>
                  <i className='tabler-reload' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
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
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-Ad'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
      <ChangeProductStatusDialog open={statusDialogOpen} onClose={setStatusDialogOpen} selectedAd={selectedAd} />
      <EditDialogue
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
        }}
        editData={selectedAd}
      />

      <AuctioBidDialog open={isAuctionDialogOpen} onClose={setIsAuctionDialogOpen} ad={selectedAd} />
    </>
  )
}

export default LiveAds
