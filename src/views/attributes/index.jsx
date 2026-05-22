'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { deleteAttribute, fetchAttributes, setPage, setPageSize } from '../../redux-store/slices/attributes'

import {
  Box,
  Card,
  CircularProgress,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Menu
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
import { fallbackImg, getFullImageUrl } from '@/utils/commonfunctions'
import { FIELD_TYPE_MAP, NO_PERMISSION } from '@/utils/constants'

import AttributeDialog from './AttributeDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import AttributeValuesDialog from './AttributeValuesDialog'
import { GetHierarchicalCategory } from '@/redux-store/slices/categories'
import { toast } from 'react-toastify'

// ---------- helpers ----------
const columnHelper = createColumnHelper()

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  const categoryId = sp.get('categoryId') || 'All'
  const fieldType = sp.get('fieldType') || 'All'
  return { page, size, categoryId, fieldType }
}

// ---------- component ----------
const Attributes = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const {
    attributes = [],
    initialLoading,
    loading,
    page,
    pageSize,
    total
  } = useSelector(state => state.attributes || {})

  const { hierarchicalCategories = [] } = useSelector(s => s.categories || {})
  const { profileData } = useSelector(state => state.adminSlice)



  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [attributeToDelete, setAttributeToDelete] = useState(null)
  const [attributeValuesDialogOpen, setAttributeValuesDialogOpen] = useState(false)
  const [attributeForValues, setAttributeForValues] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [fieldTypeFilter, setFieldTypeFilter] = useState('All')

  useEffect(() => {
    dispatch(GetHierarchicalCategory())
  }, [dispatch])

  // ---- category helpers (hierarchical multi-select with "|--" prefix per depth)
  const tree = Array.isArray(hierarchicalCategories) ? hierarchicalCategories : hierarchicalCategories?.data || []

  const flatten = (nodes = [], depth = 0) => {
    const out = []
    for (const n of nodes) {
      out.push({ id: n._id, name: n.name, depth })
      if (n.children?.length) out.push(...flatten(n.children, depth + 1))
    }
    return out
  }
  const flatOptions = useMemo(() => flatten(tree), [tree])

  useEffect(() => {
    if (hydratedFromUrl) return

    const { page: p, size: s, categoryId, fieldType } = readParams(new URLSearchParams(searchParams?.toString() || ''))

    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setCategoryFilter(categoryId)
    setFieldTypeFilter(fieldType)

    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  useEffect(() => {
    if (!hydratedFromUrl) return

    const next = new URLSearchParams(searchParams?.toString() || '')
    next.set('page', String(page))
    next.set('size', String(pageSize))

    // Add filters to URL if not 'All'
    if (categoryFilter && categoryFilter !== 'All') {
      next.set('categoryId', categoryFilter)
    } else {
      next.delete('categoryId')
    }

    if (fieldTypeFilter && fieldTypeFilter !== 'All') {
      next.set('fieldType', fieldTypeFilter)
    } else {
      next.delete('fieldType')
    }

    const queryString = next.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [page, pageSize, categoryFilter, fieldTypeFilter, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl) return

    const params = { page, pageSize }

    // Add filters only if they are not 'All'
    if (categoryFilter && categoryFilter !== 'All') {
      params.categoryId = categoryFilter
    }

    if (fieldTypeFilter && fieldTypeFilter !== 'All') {
      params.fieldType = fieldTypeFilter
    }

    dispatch(fetchAttributes(params))
  }, [page, pageSize, categoryFilter, fieldTypeFilter, hydratedFromUrl, dispatch])

  const columns = useMemo(
    () => [
      columnHelper.accessor('image', {
        header: () => 'Image',
        enableSorting: false,
        cell: ({ row }) => {
          const src = row.getValue('image')
          const name = row.original?.name || ''
          return (
            <Box className='flex items-center gap-3'>
              <img
                src={getFullImageUrl(src)}
                alt='attribute'
                className='w-10 h-10 rounded object-cover'
                onError={e => {
                  e.target.src = fallbackImg
                }}
              />
              <Typography color='text.primary' className='font-medium'>
                {name || '—'}
              </Typography>
            </Box>
          )
        }
      }),
      // Category (nested) -> categoryId.name
      columnHelper.accessor(row => row?.categoryId?.name, {
        id: 'category',
        header: () => 'Category',
        sortingFn: 'alphanumeric',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original?.categoryId?.name || '—'}
          </Typography>
        )
      }),

      // Field Type
      columnHelper.accessor('fieldType', {
        header: () => 'Field Type',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const val = getValue()
          const label = FIELD_TYPE_MAP[val] || String(val ?? '—')
          return <Chip size='small' label={label} variant='outlined' />
        }
      }),
      // Required
      columnHelper.accessor('isRequired', {
        header: () => 'Required',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const v = !!getValue()
          return <Chip size='small' label={v ? 'Yes' : 'No'} color={v ? 'success' : 'default'} variant='tonal' />
        }
      }),

      // Status (Active)
      columnHelper.accessor('isActive', {
        header: () => 'Status',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const v = !!getValue()
          return (
            <Chip size='small' label={v ? 'Active' : 'Inactive'} color={v ? 'success' : 'default'} variant='tonal' />
          )
        }
      }),

      // Created At
      columnHelper.accessor('createdAt', {
        header: () => 'Created',
        sortingFn: 'datetime',
        cell: ({ getValue }) => {
          const iso = getValue()
          const text = iso ? new Date(iso).toLocaleString() : '—'
          return (
            <Typography color='text.primary' className='font-medium'>
              {text}
            </Typography>
          )
        }
      }),

      // actions
      columnHelper.display({
        id: 'actions',
        header: () => 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Box className='flex items-center gap-2 justify-start'>
            <Tooltip title='Edit Attribute'>
              <IconButton
                size='small'
                onClick={() => {
                  setEditTarget(row.original)
                  setDialogOpen(true)
                }}
              >
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>

            <Tooltip title='Delete Attribute'>
              <IconButton
                size='small'
                onClick={() => {

                  setAttributeToDelete(row.original)
                  setIsDeleteDialogOpen(true)
                }}
              >
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>

            {Array.isArray(row.original?.values) && row.original.values.length > 0 && (
              <Tooltip title='Attribute Values'>
                <IconButton
                  size='small'
                  onClick={() => {
                    setAttributeForValues(row.original)
                    setAttributeValuesDialogOpen(true)
                  }}
                >
                  <i className='tabler-pencil' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      })
    ],
    [attributes]
  )

  const table = useReactTable({
    data: attributes,
    columns,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state: {
      pagination: { pageIndex: page - 1, pageSize: pageSize }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onPaginationChange: pagination => {
      const { pageIndex, pageSize } = pagination
      dispatch(setPage(pageIndex + 1))
      dispatch(setPageSize(pageSize))
    }
  })

  // derive values for pagination widget

  const confirmDelete = async () => {
    if (attributeToDelete?._id) {
      try {
        await dispatch(deleteAttribute(attributeToDelete._id)).unwrap()
        setIsDeleteDialogOpen(false)
        setAttributeToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setAttributeToDelete(null)
  }

  return (
    <>
      <Typography variant='h5' className='mb-5'>
        Attributes
      </Typography>

      <Card>
        <div className='flex justify-between items-center p-6'>
          <div className='flex gap-3'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newSize = Number(e.target.value)
                dispatch(setPageSize(newSize))
                dispatch(setPage(1))
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>

            <CustomTextField
              select
              value={fieldTypeFilter}
              onChange={e => {
                const value = e.target.value
                setFieldTypeFilter(value)
                dispatch(setPage(1)) // Reset to page 1 when filter changes
              }}
              className='min-w-[150px]'
            >
              <MenuItem value='All'>All Types</MenuItem>
              {Object.entries(FIELD_TYPE_MAP).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </CustomTextField>

            <CustomTextField
              select
              value={categoryFilter}
              onChange={e => {
                const value = e.target.value
                setCategoryFilter(value)
                dispatch(setPage(1)) // Reset to page 1 when filter changes
              }}
              className='w-[200px]'
            >
              <MenuItem value='All'>All Categories</MenuItem>
              {flatOptions.map((category, index) => (
                <MenuItem key={index} value={category.id}>
                  {'|--'.repeat(category.depth)}
                  {category.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </div>

          {/* Optional: hook up your own create dialog for attributes later */}
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {
              setEditTarget(null)
              setDialogOpen(true)
            }}
          >
            Add Attribute
          </Button>
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
                      length: Math.max(0, pageSize - table.getRowModel().rows.length)
                    }).map((_, index) => (
                      <tr key={`pad-${index}`}>
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
          onPageChange={p => dispatch(setPage(p))}
          onPageSizeChange={s => {
            dispatch(setPageSize(s))
            dispatch(setPage(1))
          }}
        />
      </Card>

      <AttributeDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
        }}
        mode={editTarget ? 'edit' : 'create'}
        attribute={editTarget}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-attribute'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />

      <AttributeValuesDialog
        open={attributeValuesDialogOpen}
        handleClose={() => {
          setAttributeValuesDialogOpen(false)
          setAttributeForValues(null)
        }}
        attribute={attributeForValues}
      />
    </>
  )
}

export default Attributes
