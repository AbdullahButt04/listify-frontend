'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

// Next Imports
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import { Box, CircularProgress, Switch, Tooltip } from '@mui/material'

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
  getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import TableFilters from './TableFilters'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import tableStyles from '@core/styles/table.module.css'
import DateRangePicker from '@/libs/styles/DateRangePicker'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsersData, toggleUserStatus } from '@/redux-store/slices/user'
import ExpandableText, { formatDate, getFullImageUrl, getLoginTypeColor } from '@/utils/commonfunctions'
import { setUserDateRange, setUserPage, setUserPageSize } from '../../../redux-store/slices/user'
import AddUserDialogue from './AddUserDialogue'
import NotificationDialogue from './NotificationDialogue'
import AuctionBidsDialog from './AuctionBidsDialog'
import SellerAuctionBidsDialog from './SellerAuctionBidsDialog'
import ConnectionListDialog from './ConnectionListDialog'

// ------------------------------------

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value, debounce, onChange])
  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper()

// helpers
const getParam = (sp, key, fallback) => {
  const v = sp.get(key)
  return v === null ? fallback : v
}
const coerceTriState = v => (v === 'true' || v === 'false' || v === 'All' ? v : 'All')
const parseRoleTypeFromURL = sp => {
  const s = sp.get('seller')
  return s === 'user' || s === 'seller' ? s : 'unset'
}
const normalizeTri = v => (v === 'true' ? true : v === 'false' ? false : 'All')
const stableStringify = obj => JSON.stringify(obj, Object.keys(obj).sort())

const UserListTable = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const { lang: locale } = params

  const { users, initialLoading, userTotal, userPage, userPageSize, startDate, endDate } = useSelector(
    state => state.users
  )

  // ===== Freeze initial URL on first render =====
  const initialURLRef = useRef({
    page: Number(getParam(searchParams, 'page', '1')) || 1,
    limit: Number(getParam(searchParams, 'limit', '10')) || 10,
    startDate: getParam(searchParams, 'startDate', 'All'),
    endDate: getParam(searchParams, 'endDate', 'All'),
    search: getParam(searchParams, 'search', ''),
    filters: {
      isOnline: coerceTriState(getParam(searchParams, 'online', 'All')),
      isBlocked: coerceTriState(getParam(searchParams, 'blocked', 'All')),
      isVerified: coerceTriState(getParam(searchParams, 'verified', 'All')),
      roleType: parseRoleTypeFromURL(searchParams) // 'unset' | 'user' | 'seller'
    }
  })

  // Local UI state seeded from frozen URL
  const [hydrated, setHydrated] = useState(false)
  const [globalFilter, setGlobalFilter] = useState(initialURLRef.current.search)
  const [filters, setFilters] = useState(initialURLRef.current.filters)

  const [selectedUser, setSelectedUser] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [auctionDialogOpen, setAuctionDialogOpen] = useState(false)
  const [sellerAuctionDialogOpen, setSellerAuctionDialogOpen] = useState(false)
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false)

  // Defaults used to compare & reset
  const defaultFilters = useMemo(
    () => ({ isOnline: 'All', isBlocked: 'All', isVerified: 'All', roleType: 'unset' }),
    []
  )

  // Is anything currently active?
  const hasActiveFilters = useMemo(() => {
    const triChanged =
      filters.isOnline !== defaultFilters.isOnline ||
      filters.isBlocked !== defaultFilters.isBlocked ||
      filters.isVerified !== defaultFilters.isVerified ||
      filters.roleType !== defaultFilters.roleType

    const datesChanged = !(startDate === 'All' && endDate === 'All')
    const searchChanged = Boolean(globalFilter)

    return triChanged || datesChanged || searchChanged
  }, [filters, globalFilter, startDate, endDate, defaultFilters])

  // One-click reset
  const handleResetAll = useCallback(() => {
    setFilters(defaultFilters)
    setGlobalFilter('')
    dispatch(setUserDateRange({ startDate: 'All', endDate: 'All' }))
    dispatch(setUserPage(1)) // go back to first page
    // URL sync effect will handle the querystring update
  }, [defaultFilters, dispatch])

  // ===== One-time hydration to align Redux with frozen URL =====
  useEffect(() => {
    const { page, limit, startDate: s, endDate: e } = initialURLRef.current

    let changed = false
    if (limit !== userPageSize) {
      dispatch(setUserPageSize(limit))
      changed = true
    }
    if (page !== userPage) {
      dispatch(setUserPage(page))
      changed = true
    }

    // Only push date range if URL provided both
    if (s !== 'All' && e !== 'All') {
      if (s !== startDate || e !== endDate) {
        dispatch(setUserDateRange({ startDate: s, endDate: e }))
        changed = true
      }
    } else {
      // normalize to All/All if store is different
      if (startDate !== 'All' || endDate !== 'All') {
        dispatch(setUserDateRange({ startDate: 'All', endDate: 'All' }))
        changed = true
      }
    }

    // If nothing needed changing, we can hydrate immediately
    if (!changed) setHydrated(true)
    // else: another effect below will flip hydrated once store values match
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once

  // When Redux values catch up to the URL snapshot, mark hydrated
  useEffect(() => {
    if (hydrated) return
    const { page, limit, startDate: s, endDate: e } = initialURLRef.current
    const matches =
      userPage === page && userPageSize === limit && String(startDate) === String(s) && String(endDate) === String(e)
    if (matches) setHydrated(true)
  }, [hydrated, userPage, userPageSize, startDate, endDate])

  // ===== URL ← state sync (idempotent) =====
  useEffect(() => {
    if (!hydrated) return

    const params = new URLSearchParams()
    params.set('page', String(userPage))
    params.set('limit', String(userPageSize))
    if (globalFilter) params.set('search', globalFilter)

    if (filters.isOnline !== 'All') params.set('online', String(filters.isOnline))
    if (filters.isBlocked !== 'All') params.set('blocked', String(filters.isBlocked))
    if (filters.isVerified !== 'All') params.set('verified', String(filters.isVerified))
    if (filters.roleType === 'user' || filters.roleType === 'seller') params.set('seller', filters.roleType)

    if (startDate !== 'All' && endDate !== 'All') {
      params.set('startDate', startDate)
      params.set('endDate', endDate)
    }

    const nextQs = params.toString()
    const currentQs = searchParams.toString()
    if (nextQs !== currentQs) {
      router.replace(nextQs ? `?${nextQs}` : '?', { scroll: false })
    }
  }, [hydrated, router, userPage, userPageSize, filters, globalFilter, startDate, endDate, searchParams])

  const handleFilterChange = useCallback(
    newFilters => {
      setFilters(prev => ({ ...prev, ...newFilters }))
      // Reset to first page when filters change
      dispatch(setUserPage(1))
    },
    [dispatch]
  )

  // ===== Build ONE normalized server query & fire exactly once per change =====
  const serverQuery = useMemo(() => {
    const q = {
      start: userPage,
      limit: userPageSize,
      startDate,
      endDate,
      search: globalFilter,
      isBlocked: normalizeTri(filters.isBlocked),
      isOnline: normalizeTri(filters.isOnline),
      isVerified: normalizeTri(filters.isVerified)
    }
    if (filters.roleType === 'user') q.isSeller = false
    if (filters.roleType === 'seller') q.isSeller = true
    return q
  }, [userPage, userPageSize, startDate, endDate, globalFilter, filters])

  const queryKey = useMemo(() => stableStringify(serverQuery), [serverQuery])
  const lastKeyRef = useRef()

  useEffect(() => {
    if (!hydrated) return
    if (queryKey === lastKeyRef.current) return
    lastKeyRef.current = queryKey
    dispatch(fetchUsersData(serverQuery))
  }, [hydrated, queryKey, serverQuery, dispatch])

  const handleToggleStatus = Id => {
    dispatch(toggleUserStatus(Id))
  }

  const handleEdit = row => {
    setSelectedUser(row)
    setOpenDialog(true)
  }

  const handleOpenConnectionDialog = row => {
    setSelectedUser(row)
    setIsConnectionDialogOpen(true)
  }

  const handleBids = user => {
    // if (filters.roleType === 'user') setAuctionDialogOpen(true)
    // else setSellerAuctionDialogOpen(true)
    // setSelectedUser(bids)
    if (user.isSeller) {
      router.push(`/${locale}/user/seller-bids?userId=${user._id}&name=${user.name}`)
    } else {
      router.push(`/${locale}/user/user-bids?userId=${user._id}&name=${user.name}`)
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(row?.original?.profileImage), fullName: row?.original?.name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.name || 'No Name'}
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {row?.original?.email}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('totalFollows', {
        header: 'Follows',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.totalFollows}
          </Typography>
        )
      }),
      columnHelper.accessor('totalFollowings', {
        header: 'Followings',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.totalFollowings}
          </Typography>
        )
      }),
      columnHelper.accessor('totalFriends', {
        header: 'Friends',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.totalFriends}
          </Typography>
        )
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Number',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row?.original?.phoneNumber ? row?.original?.phoneNumber : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('isSeller', {
        header: 'is seller',
        cell: ({ getValue, row }) => (
          <span className='space-x-2'>
            <Chip
              label={getValue() ? 'Yes' : 'No'}
              color={getValue() ? 'success' : 'error'}
              // size='small'
              variant='tonal'
            />
            {getValue() && <Chip label={`Ads : ${row.original.totalAds}`} color='secondary' variant='tonal' />}
          </span>
        )
      }),
      columnHelper.accessor('loginType', {
        header: 'login type',
        cell: ({ getValue }) => {
          const { label, color } = getLoginTypeColor(getValue())
          return <Chip label={label} color={color} variant='tonal' />
        }
      }),
      columnHelper.accessor('registeredAt', {
        header: 'registered Time',
        cell: ({ getValue }) => (
          <Typography className='capitalize' color='text.primary'>
            {getValue() || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('lastLoginAt', {
        header: 'last Login',
        cell: ({ getValue }) => (
          <Typography className='capitalize' color='text.primary'>
            {getValue() || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'createdAt',
        cell: ({ getValue }) => (
          <Typography className='capitalize' color='text.primary'>
            {formatDate(getValue()) || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('isOnline', {
        header: () => 'Status',
        cell: ({ row }) => (
          <Chip
            label={row.original.isOnline ? 'Online' : 'Offline'}
            color={row.original.isOnline ? 'success' : 'error'}
            size='small'
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('isVerified', {
        header: () => 'Verified',
        cell: ({ row }) => (
          <Chip
            label={row.original.isVerified ? 'Verified' : 'Not Verified'}
            color={row.original.isVerified ? 'success' : 'error'}
            size='small'
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Block',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Switch
              checked={row.original.isBlocked}
              onChange={() => handleToggleStatus(row.original._id)}
              size='small'
            />
          </div>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('action', {
        header: (
          <Typography className='text-sm text-center font-medium' color='text.primary'>
            ACTION
          </Typography>
        ),
        cell: ({ row }) => (
          <div className='flex items-center'>
            <Tooltip title='See Auction Bids'>
              <IconButton
                onClick={() => {
                  handleBids(row.original)
                }}
              >
                <i className='tabler-user-hexagon text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='See Connections'>
              <IconButton onClick={() => handleOpenConnectionDialog(row.original)}>
                <i className='tabler-friends text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Send Notification'>
              <IconButton
                onClick={() => {
                  setNotificationDialogOpen(true)
                  setSelectedUser(row.original)
                }}
              >
                <i className='tabler-bell-ringing text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit User'>
              <IconButton onClick={() => handleEdit(row.original)}>
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, filters.roleType]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Server pagination only
    manualPagination: true,
    state: { pagination: { pageIndex: userPage - 1, pageSize: userPageSize } },
    pageCount: Math.max(1, Math.ceil((userTotal || 0) / (userPageSize || 1))),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = ({ avatar, fullName }) =>
    avatar ? <CustomAvatar src={avatar} size={34} /> : <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>

  return (
    <>
      <Card>
        <TableFilters onFilterChange={handleFilterChange} initialFilters={filters} />

        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-4 gap-4'>
          <div className='flex gap-2'>
            <CustomTextField
              select
              value={userPageSize}
              onChange={e => dispatch(setUserPageSize(Number(e.target.value)))}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='5'>5</MenuItem>
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>

          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search User'
              label='Search user by name, email, uniqueID'
              className='max-sm:is-full w-64'
            />

            <div className='ms-2 mt-[15px]'>
              <DateRangePicker
                buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
                buttonClassName=''
                setAction={setUserDateRange}
                initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
                initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
                showClearButton={startDate !== 'All' && endDate !== 'All'}
                onClear={() => dispatch(setUserDateRange({ startDate: 'All', endDate: 'All' }))}
                onChange={range => dispatch(setUserDateRange(range))}
              />

              {hasActiveFilters && (
                <Tooltip title='Reset filters'>
                  <IconButton color='primary' onClick={handleResetAll} size='small' className='ms-2'>
                    <i className='tabler-reload' />
                  </IconButton>
                </Tooltip>
              )}
            </div>
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
                {table.getRowModel().rows.length === 0 && !initialLoading ? (
                  Array.from({ length: userPageSize }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      {index === Math.floor(userPageSize / 2) ? (
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
                    {Array.from({ length: Math.max(0, userPageSize - table.getRowModel().rows.length) }).map(
                      (_, index) => (
                        <tr key={`empty-${index}`}>
                          {table.getVisibleFlatColumns().map(column => (
                            <td key={column.id}>&nbsp;</td>
                          ))}
                        </tr>
                      )
                    )}
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
              page={userPage}
              pageSize={userPageSize}
              total={userTotal}
              onPageChange={page => dispatch(setUserPage(page))}
              onPageSizeChange={size => dispatch(setUserPageSize(size))}
            />
          )}
          count={userTotal}
          page={userPage - 1}
          onPageChange={(_, newPage) => dispatch(setUserPage(newPage + 1))}
          rowsPerPage={userPageSize}
          onRowsPerPageChange={e => {
            dispatch(setUserPageSize(Number(e.target.value)))
            dispatch(setUserPage(1))
          }}
        />
      </Card>

      <AddUserDialogue open={openDialog} onClose={() => setOpenDialog(false)} editData={selectedUser} />
      <NotificationDialogue
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        selectedUserData={selectedUser}
      />
      <AuctionBidsDialog open={auctionDialogOpen} onClose={() => setAuctionDialogOpen(false)} user={selectedUser} />
      <SellerAuctionBidsDialog
        open={sellerAuctionDialogOpen}
        onClose={() => setSellerAuctionDialogOpen(false)}
        user={selectedUser}
      />
      <ConnectionListDialog
        open={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
        user={selectedUser}
      />
    </>
  )
}

export default UserListTable
