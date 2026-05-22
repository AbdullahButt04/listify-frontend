'use client'

import { useEffect, useState, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'

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

import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSubscriberPlansList,
  removeSubscriptionPlan,
  setPage,
  setPageSize,
  toggleSubscriptionPlan
} from '@/redux-store/slices/subscriptionPlan'
import ExpandableText, { getFullImageUrl } from '@/utils/commonfunctions'
import { Box, CircularProgress, Switch } from '@mui/material'
import SubscriptionPlanDialogue from './SubscriptionPlanDialogue'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({
    itemRank
  })
  return itemRank.passed
}

const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  // Yahan pe filter params bhi parse kar sakte ho agar chahiye (e.g. search/filter)
  return { page, size }
}

const SubscriptionPlanTable = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { subscriberPlans = [], initialLoading, page, pageSize, total } = useSelector(state => state.subScriptionPlan)
  const { profileData } = useSelector(state => state.adminSlice)



  // States
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

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
    dispatch(fetchSubscriberPlansList({ page, pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  const handleAdd = () => {
    setSelectedSubscriptionPlan(null)
    setOpenDialog(true)
  }

  const handleEdit = plan => {
    setSelectedSubscriptionPlan(plan)
    setOpenDialog(true)
  }

  const handleDelete = plan => {

    setSelectedSubscriptionPlan(plan)
    setConfirmOpen(true)
  }

  const confirmDeleteAction = () => {
    if (selectedSubscriptionPlan && selectedSubscriptionPlan._id) {
      dispatch(removeSubscriptionPlan(selectedSubscriptionPlan._id))
    }
    setConfirmOpen(false)
    setSelectedTip(null)
  }

  const handleToggleStatus = planId => {

    dispatch(toggleSubscriptionPlan(planId))
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('plan', {
        header: 'Plan',
        cell: ({ row }) => (
          <div className='flex items-center gap-4 '>
            {getAvatar({ avatar: getFullImageUrl(row.original.image), fullName: row.original.name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name}
              </Typography>
            </div>
          </div>
        )
      }),

      columnHelper.accessor('description', {
        header: 'Description',
        cell: ({ row }) => <ExpandableText text={row.original.description} lineClamp={2} maxWidth={200} />
      }),

      columnHelper.accessor('price', {
        header: 'price',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.price}
          </Typography>
        )
      }),
      columnHelper.accessor('discount', {
        header: 'discount',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.discount}
          </Typography>
        )
      }),
      columnHelper.accessor('finalPrice', {
        header: 'finalPrice',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.finalPrice}
          </Typography>
        )
      }),

      columnHelper.accessor('days', {
        header: 'days',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.days.value === 0 ? 'unlimited' : row.original.days.value}
          </Typography>
        )
      }),
      columnHelper.accessor('advertisements', {
        header: 'advertisement limit',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.advertisements.value === 0 ? 'unlimited' : row.original.advertisements.value}
          </Typography>
        )
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
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={() => handleEdit(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original)}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [subscriberPlans]
  )

  const table = useReactTable({
    data: subscriberPlans,
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

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  return (
    <>
      <Box className='flex items-center justify-between mb-5'>
        <Typography variant='h5'>Subscription Plan</Typography>

        <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {
            // if (!permission) return toast.error('You are not authorized')
            handleAdd()
          }}
          className='max-sm:is-full'
        >
          Add New Plan
        </Button>
      </Box>
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
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
          table={table}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={page => dispatch(setPage(page))}
          onPageSizeChange={size => {
            dispatch(setPageSize(size)) // Redux pageSize update
            dispatch(setPage(1)) // Page reset on user pageSize change (added)
          }}
        />
      </Card>
      <SubscriptionPlanDialogue
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editData={selectedSubscriptionPlan}
      />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-subscription-plan'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default SubscriptionPlanTable
