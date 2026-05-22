'use client'

import { useMemo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { fetchCategories, deleteCategory, setPage, setPageSize } from '../../redux-store/slices/categories'
import { Box, Button, Card, CircularProgress, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material'
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
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import CategoryDialog from './CategoryDialog'
import ExpandableRow from './ExpandableRow'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

// Column Definitions
const columnHelper = createColumnHelper()

// Helpers
const formatDate = iso => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const readParams = sp => {
  const page = Number(sp.get('page')) || 1
  const size = Number(sp.get('size')) || 10
  return { page, size }
}

const Categories = () => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { categories = [], page, pageSize, initialLoading, total, loading } = useSelector(state => state.categories)
  const { profileData } = useSelector(state => state.adminSlice)



  // States for dialog management
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create') // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [selectedCategoryForSubCategory, setSelectedCategoryForSubCategory] = useState(null)

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
    dispatch(fetchCategories({ page, pageSize }))
  }, [page, pageSize, hydratedFromUrl, dispatch])

  // Handle Edit Category
  const handleEditCategory = category => {
    setSelectedCategory(category)
    setDialogMode('edit')
    setIsCategoryDialogOpen(true)
  }

  // Handle Create Category
  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setDialogMode('create')
    setIsCategoryDialogOpen(true)
  }

  // Handle Delete Category
  const handleDeleteCategory = category => {

    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  // Confirm Delete
  const confirmDelete = async () => {
    if (categoryToDelete?._id) {
      try {
        await dispatch(deleteCategory(categoryToDelete._id)).unwrap()
        setIsDeleteDialogOpen(false)
        setCategoryToDelete(null)
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  // Cancel Delete
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  // Close Category Dialog
  const handleCloseDialog = () => {
    setIsCategoryDialogOpen(false)
    setSelectedCategory(null)
    setDialogMode('create')
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => 'Name',
        sortingFn: 'alphanumeric'
      }),
      columnHelper.accessor('slug', {
        header: () => 'Slug',
        sortingFn: 'alphanumeric'
      }),
      columnHelper.accessor('isActive', {
        header: () => 'Status'
      }),
      columnHelper.accessor('subcategoryCount', {
        header: () => (
          <Typography variant='body3' className='mx-auto'>
            sub categories
          </Typography>
        )
      }),
      columnHelper.accessor('customFieldCount', {
        header: () => (
          <Typography variant='body3' className='mx-auto'>
            custom Fields
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: () => 'Created',
        sortingFn: 'datetime'
      }),
      columnHelper.accessor('updatedAt', {
        header: () => 'Updated',
        sortingFn: 'datetime'
      }),
      columnHelper.accessor('_id', {
        header: () => 'Actions',
        enableSorting: false
      })
    ],
    []
  )

  const table = useReactTable({
    data: categories,
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
      <Typography variant='h5' className='mb-5'>
        Categories
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
              // updateUrlPagination(1, newPageSize)
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleCreateCategory}>
            Add Category
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
                {categories.length === 0 && !initialLoading ? (
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
                    {categories.map(category => (
                      <ExpandableRow
                        key={category._id}
                        category={category}
                        level={0}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        columnCount={table.getVisibleFlatColumns().length}
                      />
                    ))}
                    {Array.from({
                      length: Math.max(0, pageSize - categories.length)
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        setOpen={setIsDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        type='delete-category'
        confirmText='Delete'
        cancelText='Cancel'
        loading={loading}
      />

      {/* Category Dialog for Create/Edit */}
      <CategoryDialog
        open={isCategoryDialogOpen}
        onClose={handleCloseDialog}
        mode={dialogMode}
        category={selectedCategory}
        categoryId={selectedCategoryForSubCategory}
      />
    </>
  )
}

export default Categories
