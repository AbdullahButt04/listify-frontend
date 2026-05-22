'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Rating from '@mui/material/Rating'
import { CircularProgress, TablePagination } from '@mui/material'
import Typography from '@mui/material/Typography'
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
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
import { getReviewList, removeReview, setReviewPage, setReviewPageSize } from '@/redux-store/slices/review'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { IconButton, Tooltip } from '@mui/material'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({
    itemRank
  })
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1 // URL se page
  const size = Number(sp.get('size')) || 10 // URL se pageSize
  return { page, size }
}

const ManageReviewsTable = ({ reviewsData }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { review, reviewPage, reviewPageSize, reviewTotal, initialLoading } = useSelector(state => state.review)

  const { profileData } = useSelector(state => state.adminSlice)



  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [status, setStatus] = useState('All')
  const [rowSelection, setRowSelection] = useState({})
  const [allData, setAllData] = useState([])
  const [data, setData] = useState(allData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectReview, setSelectReview] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (hydratedFromUrl) return

    const { page, size } = readParams(new URLSearchParams(searchParams?.toString() || ''))
    dispatch(setReviewPage(page)) // Set redux page from URL - Added for hydration
    dispatch(setReviewPageSize(size)) // Set redux pageSize from URL - Added for hydration

    setHydratedFromUrl(true) // Mark hydrated so that hydration does not repeat
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return

    const next = new URLSearchParams(searchParams?.toString() || '')
    next.set('page', String(reviewPage)) // Update page param in URL - Added for URL sync
    next.set('size', String(reviewPageSize)) // Update pageSize param in URL - Added for URL sync

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false }) // Replace URL without reload
  }, [reviewPage, reviewPageSize, hydratedFromUrl, router, pathname, searchParams])

  // API call dispatch when redux page/pageSize changes (after hydration)
  useEffect(() => {
    if (!hydratedFromUrl) return

    dispatch(getReviewList({ start: reviewPage, limit: reviewPageSize })) // API call with current redux pagination
  }, [reviewPage, reviewPageSize, hydratedFromUrl, dispatch])

  useEffect(() => {
    setAllData(review)
  }, [review])

  const handleDelete = row => {

    setSelectReview(row)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectReview && selectReview._id) {
      dispatch(removeReview(selectReview._id))
    }
    setConfirmOpen(false)
    setSelectReview(null)
  }
  const columns = useMemo(
    () => [
      columnHelper.accessor('reviewer', {
        header: 'Reviewer',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <img
              src={getFullImageUrl(row?.original?.reviewer?.profileImage)}
              width={38}
              height={38}
              className='rounded bg-actionHover'
            />
            <div className='flex flex-col items-start'>
              <Typography className='font-medium' color='text.primary'>
                {row?.original?.reviewer?.name}
              </Typography>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('head', {
        header: 'Review',
        sortingFn: (rowA, rowB) => rowA.original.review - rowB.original.review,
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            <Rating
              name='product-review'
              readOnly
              value={row?.original?.rating}
              emptyIcon={<i className='tabler-star-filled' />}
            />
            <Typography variant='body2' className='text-wrap'>
              {row?.original?.reviewText}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('date', {
        header: 'Created Date',
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA?.original?.reviewedAt)
          const dateB = new Date(rowB?.original?.reviewedAt)

          return dateA.getTime() - dateB.getTime()
        },
        cell: ({ row }) => {
          const date = new Date(row?.original?.reviewedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          })
          return <Typography>{date}</Typography>
        }
      }),

      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <Tooltip title='Delete'>
            <IconButton onClick={() => handleDelete(row.original)} color='error'>
              <i className='tabler-trash' />
            </IconButton>
          </Tooltip>
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
    state: { pagination: { pageIndex: reviewPage - 1, pageSize: reviewPageSize } },
    pageCount: Math.max(1, Math.ceil((reviewTotal || 0) / (reviewPageSize || 1))),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  useEffect(() => {
    const filteredData = allData?.filter(review => {
      if (status !== 'All' && review.status !== status) return false
      return true
    })
    setData(filteredData)
  }, [status, allData, setData])

  return (
    <>
      <Typography variant='h5' className='mb-5'>
        Review
      </Typography>
      <Card>
        <div className='flex flex-wrap justify-between gap-4 p-4'>
          <div className='flex justify-start flex-col items-start md:flex-row md:items-center gap-4'>
            <CustomTextField
              select
              value={reviewPageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value)
                dispatch(setReviewPageSize(newPageSize)) // Update pageSize in redux - added
                dispatch(setReviewPage(1)) // Reset page to 1 on pageSize change - added
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>
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
                  Array.from({ length: reviewPageSize }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(reviewPageSize / 2) ? (
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
                      length: reviewPageSize - table.getRowModel().rows.length
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
              page={reviewPage}
              pageSize={reviewPageSize}
              total={reviewTotal}
              onPageChange={page => dispatch(setReviewPage(page))}
              onPageSizeChange={size => {
                dispatch(setReviewPageSize(size)) // Update redux pageSize
                dispatch(setReviewPage(1)) // Reset page to 1 on pageSize change
              }}
            />
          )}
          count={reviewTotal}
          page={reviewPage - 1} // zero based index
          onPageChange={(_, newPage) => dispatch(setReviewPage(newPage + 1))}
          rowsPerPage={reviewPageSize}
          onRowsPerPageChange={e => {
            dispatch(setReviewPageSize(Number(e.target.value)))
            dispatch(setReviewPage(1))
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-review'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default ManageReviewsTable
