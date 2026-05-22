'use client'

import { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@components/TablePaginationComponent'
import ExpandableText, { fallbackImg, formatDate, getFullImageUrl } from '@/utils/commonfunctions'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

import {
  deleteAdVideo,
  fetchAllAds,
  fetchAllAdsForFilter,
  fetchAllAdVideos,
  fetchAllUsers,
  fetchAllUsersForFilter,
  setPage,
  setPageSize
} from '@/redux-store/slices/adVideo'
import CustomAvatar from '@/@core/components/mui/Avatar'

import VideoViewerDialog from './VideoViewDialog'
import AdVideoDialog from './AdVideoDialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Column Definitions
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  const adId = sp.get('adId') || 'ALL'
  const userId = sp.get('userId') || 'ALL'
  return { page, size, adId, userId }
}

const AdVideos = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  const { initialLoading, adVideos, page, pageSize, total, loading, allAdsForFilter, allUsersForFilter } = useSelector(
    state => state.adVideos
  )

  const { profileData } = useSelector(state => state.adminSlice)



  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [filter, setFilter] = useState({ adId: 'ALL', userId: 'ALL' })
  const [selectedAdVideo, setSelectedAdVideo] = useState(null)
  const [isViewVideoDialog, setIisViewVideoDialog] = useState(false)
  const [isAdVideoDialog, setIsAdVideoDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (hydratedFromUrl) return
    const { page: p, size: s, adId: a, userId: u } = readParams(new URLSearchParams(searchParams?.toString() || ''))
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setFilter({ adId: a, userId: u }) // set local filter state from URL
    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return
    const next = new URLSearchParams(searchParams?.toString() || '')

    next.set('page', String(page))
    next.set('size', String(pageSize))
    next.set('adId', filter.adId)
    next.set('userId', filter.userId)

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [page, pageSize, filter, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl) return
    dispatch(fetchAllAdVideos({ page, pageSize, adId: filter.adId, userId: filter.userId }))
    dispatch(fetchAllUsers())
  }, [page, pageSize, filter, hydratedFromUrl, dispatch])

  useEffect(() => {
    dispatch(fetchAllAdsForFilter())
    dispatch(fetchAllUsersForFilter())
  }, [dispatch])

  const columns = useMemo(
    () => [
      columnHelper.accessor('uploader', {
        header: () => 'user',
        cell: ({ getValue }) => {
          return (
            <Box className='flex gap-2 items-center'>
              <CustomAvatar src={getFullImageUrl(getValue().profileImage)} size={40} />
              <Typography color='text.primary' className='font-medium'>
                {getValue().name}
              </Typography>
            </Box>
          )
        }
      }),
      columnHelper.accessor('adDetails', {
        header: () => 'ad Details',
        cell: ({ getValue, row }) => (
          <Box className='flex gap-2 items-center'>
            <CustomAvatar src={getFullImageUrl(getValue().primaryImage)} size={45} />
            <Box>
              <Typography color='text.primary' className='font-medium'>
                {getValue().title}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {getValue().subTitle}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                $ {row.original.adDetails.price}
              </Typography>
            </Box>
          </Box>
        )
      }),
      columnHelper.accessor('videoUrl', {
        header: () => 'video',
        cell: ({ getValue, row }) => (
          <div className='relative w-fit'>
            <img
              src={getFullImageUrl(row.original.thumbnailUrl)}
              alt={row.original.caption}
              className='w-[70px] aspect-square object-cover'
            />
            <div className='absolute inset-0 flex justify-center items-center'>
              <Tooltip title='Play Video'>
                <IconButton size='small' color='primary' onClick={() => handleViewVideo(row.original)}>
                  <i className='tabler-play' />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        )
      }),
      // columnHelper.accessor('caption', {
      //   header: () => 'caption',
      //   cell: ({ getValue }) => (
      //     <Typography color='text.primary' className='font-medium'>
      //       {getValue()}
      //     </Typography>
      //   )
      // }),

      columnHelper.accessor('description', {
        header: () => 'ad description',
        cell: ({ row }) => (
          <Box sx={{ width: 150 }}>
            <Tooltip title={row.original.adDetails.description}>
              <Typography color='text.primary' className='font-medium truncate' noWrap>
                {row.original.adDetails.description}
              </Typography>
            </Tooltip>
          </Box>
        )
      }),
      columnHelper.accessor('shares', {
        header: () => 'counts',
        cell: ({ getValue, row }) => (
          <Box>
            <Typography color='text.primary' className='font-medium'>
              Total Share : {getValue()}
            </Typography>
            <Typography color='text.primary' className='font-medium'>
              Total Likes : {row.original.totalLikes}
            </Typography>
          </Box>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: () => 'Created',
        sortingFn: 'datetime',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {formatDate(getValue())}
          </Typography>
        )
      }),
      columnHelper.accessor('_id', {
        header: () => 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Tooltip title='Edit Category'>
              <IconButton size='small' onClick={() => handleAdVideoDialog(row.original, 'edit')}>
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete Category'>
              <IconButton size='small' onClick={() => handleDeleteVideo(row.original)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [adVideos]
  )

  const table = useReactTable({
    data: adVideos,
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

  const handleAdVideoDialog = (ad, mode) => {
    setIsAdVideoDialog(true)
    setDialogMode(mode)
    setSelectedAdVideo(ad)
  }

  const handleViewVideo = ad => {
    setIisViewVideoDialog(true)
    setSelectedAdVideo(ad)
  }

  const handleDeleteVideo = ad => {

    setIsDeleteDialogOpen(true)
    setSelectedAdVideo(ad)
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setSelectedAdVideo(null)
  }

  const confirmDelete = async () => {
    if (selectedAdVideo?._id) {
      try {
        await dispatch(deleteAdVideo(selectedAdVideo._id)).unwrap()
        setIsDeleteDialogOpen(false)
        setSelectedAdVideo(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '16px' }}>
        <Typography variant='h5'>Ad Videos</Typography>
        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => handleAdVideoDialog(null, 'create')}
        >
          Add Ad Video
        </Button>
      </Box>
      <Card>
        <div className='flex justify-between items-center p-6'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)
              dispatch(setPageSize(newPageSize))
              dispatch(setPage(1))
              // updateUrlPagination(1, newPageSize)
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>

          <Box sx={{ display: 'flex', gap: '10px' }}>
            <CustomTextField
              select
              value={filter.userId}
              onChange={e => {
                setFilter({ ...filter, userId: e.target.value })
              }}
              className='max-sm:is-full sm:is-[200px]'
            >
              <MenuItem value='ALL'>Select User</MenuItem>
              {allUsersForFilter.map(u => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name}
                </MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              select
              value={filter.adId}
              onChange={e => {
                setFilter({ ...filter, adId: e.target.value })
              }}
              className='max-sm:is-full sm:is-[250px]'
            >
              <MenuItem value='ALL'>Select Ad</MenuItem>
              {allAdsForFilter.map(ad => (
                <MenuItem key={ad._id} value={ad._id} className='truncate'>
                  {ad.title}
                </MenuItem>
              ))}
            </CustomTextField>
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
                          <td key={column.id}></td>
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
      <VideoViewerDialog open={isViewVideoDialog} onClose={setIisViewVideoDialog} video={selectedAdVideo} />
      <AdVideoDialog open={isAdVideoDialog} onClose={setIsAdVideoDialog} mode={dialogMode} ad={selectedAdVideo} />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-advideo'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />
    </>
  )
}

export default AdVideos
