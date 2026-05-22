import React, { forwardRef, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Button
} from '@mui/material'
import classnames from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getSubCategories, resetSubCategories } from '@/redux-store/slices/categories'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import { fallbackImg, getFullImageUrl } from '@/utils/commonfunctions'

// ----- Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// ----- helpers reused from your page
const columnHelper = createColumnHelper()

const formatDate = iso => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const toWebPath = p => (p ? p.replace(/\\/g, '/') : '')

const SubCategoryTableDialog = ({ open, onClose, category, setCategory, openCategoryDialog }) => {
  const dispatch = useDispatch()

  const {
    subCategories = [],
    subCategoryLoading,
    subCategoryTotal = 0,
    subCategoryPage = 1,
    subCategoryHasMore = true,
    subCategoryLimit = 10
  } = useSelector(state => state.categories)

  const contentRef = useRef(null)
  const sentinelRef = useRef(null)

  // Reset & first page on open/category change
  useEffect(() => {
    if (!open || !category?._id) return
    dispatch(resetSubCategories())
    dispatch(getSubCategories({ parentId: category._id, start: 1, limit: subCategoryLimit }))
  }, [dispatch, open, category?._id, subCategoryLimit])

  const handleClose = () => {
    onClose()
    setCategory(null)
  }

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!open) return
    const root = contentRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const io = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && !subCategoryLoading && subCategoryHasMore && category?._id) {
          const next = (subCategoryPage || 1) + 1
          dispatch(getSubCategories({ parentId: category._id, start: next, limit: subCategoryLimit }))
        }
      },
      { root, rootMargin: '200px 0px 200px 0px', threshold: 0.01 }
    )

    io.observe(sentinel)
    return () => io.disconnect()
  }, [open, subCategoryLoading, subCategoryHasMore, subCategoryPage, subCategoryLimit, category?._id, dispatch])

  // ----- Columns (mirror your Categories table style; adjust fields if your subcategory model differs)
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => 'Name',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor('slug', {
        header: () => 'Slug',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {getValue()}
          </Typography>
        )
      }),
      // Optional: keep if subcategories have images
      columnHelper.accessor('image', {
        header: () => 'Image',
        enableSorting: false,
        cell: ({ getValue }) => {
          const img = getValue?.()
          if (!img) return <span>-</span>
          const webPath = toWebPath(img)
          const fullUrl = getFullImageUrl(webPath)
          return (
            <Box className='flex items-center'>
              <img
                src={fullUrl}
                alt='Subcategory'
                className='w-10 h-10 object-cover rounded'
                onError={e => {
                  e.currentTarget.src = fallbackImg
                }}
              />
            </Box>
          )
        }
      }),
      columnHelper.accessor('isActive', {
        header: () => 'Status',
        cell: ({ getValue }) => (
          <Chip
            size='small'
            label={getValue() ? 'Active' : 'Inactive'}
            color={getValue() ? 'success' : 'error'}
            variant='tonal'
          />
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
      columnHelper.accessor('updatedAt', {
        header: () => 'Updated',
        sortingFn: 'datetime',
        cell: ({ getValue }) => (
          <Typography color='text.primary' className='font-medium'>
            {formatDate(getValue())}
          </Typography>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: subCategories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
    // no pagination row model — we’re streaming/append-only
  })

  const loadedCount = subCategories.length
  const showSpinnerRow = subCategoryLoading
  const showEndCap = !subCategoryLoading && !subCategoryHasMore && subCategoryTotal > 0

  const handleCreateCategory = () => {}

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '950px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <div className='flex justify-between items-center'>
          <Typography variant='h5' component='span'>
            Sub Categories of {category?.name}
          </Typography>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => openCategoryDialog(true)}
          >
            Add Sub Category
          </Button>
        </div>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2' ref={contentRef}>
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
              {/* rows */}
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}

              {/* spinner row while fetching the next page */}
              {showSpinnerRow && (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  </td>
                </tr>
              )}

              {/* end-cap when all data loaded */}
              {showEndCap && (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      Loaded {loadedCount} of {subCategoryTotal}
                    </Box>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* sentinel used by IntersectionObserver; must be inside the same scroll container */}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </DialogContent>
    </Dialog>
  )
}

export default SubCategoryTableDialog
