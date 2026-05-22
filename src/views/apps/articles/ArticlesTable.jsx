'use client'

import { useEffect, useLayoutEffect, useRef, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Box, CardContent, MenuItem } from '@mui/material'

import defaultImage from '@/assets/images/defaultImage.jpg'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBlogList,
  removeBlog,
  setPage,
  setPageSize,
  setPagination,
  updateBlogTrending
} from '@/redux-store/slices/blog'
import { formatDate, getFullImageUrl } from '@/utils/commonfunctions'

import BlogDialogue from './dialogue'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import BlogDetailsDialog from './viewDetailsDialogue'
import CustomTextField from '@/@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import BlogCardShimmer from './BlogCardShimmer'
import { useState } from 'react'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const toInt = (v, fallback) => {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const ArticlesTable = () => {
  const dispatch = useDispatch()
  const { blog, loading, initialLoading, page, pageSize, total } = useSelector(s => s.blog)

  const { profileData } = useSelector(state => state.adminSlice)



  const [selectedBlog, setSelectedBlog] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [detailsData, setDetailsData] = useState(null)

  // --- URL sync (Next.js 15 App Router) ---
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [ready, setReady] = useState(false) // ✅ gate rendering & fetching

  // We’ll guard the first fetch until we’ve synced store <- URL once.
  const hydratedRef = useRef(false)

  // 1) Sync Redux from URL BEFORE paint to avoid visual jump
  useLayoutEffect(() => {
    const urlPage = toInt(searchParams.get('page'), 1)
    const urlSize = toInt(searchParams.get('pageSize'), 10)

    // atomic set prevents page=1 blip caused by setPageSize reducer
    dispatch(setPagination({ page: urlPage, pageSize: urlSize }))

    hydratedRef.current = true
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // 2) After hydration, fetch whenever page/pageSize change.
  useEffect(() => {
    if (!ready) return
    const ctrl = new AbortController()
    // dispatch thunk (axios picks up thunkAPI.signal; we also keep a local for clarity)
    dispatch(fetchBlogList({ page, pageSize }))

    return () => {
      // let RTK cancel via thunkAPI.signal; no extra manual abort needed here
      // (kept for reference: ctrl.abort())
    }
  }, [dispatch, ready, page, pageSize])

  // 3) Whenever page or pageSize change, push them to the URL (no scroll, replace to avoid history spam).
  useEffect(() => {
    if (!ready) return
    const currPage = toInt(searchParams.get('page'), 1)
    const currSize = toInt(searchParams.get('pageSize'), 10)
    if (currPage === page && currSize === pageSize) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [ready, page, pageSize, router, pathname, searchParams])

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedBlog(null)
    setOpenDialog(true)
  }
  const handleEdit = b => {
    setSelectedBlog(b)
    setOpenDialog(true)
  }
  const handleDelete = b => {

    setSelectedBlog(b)
    setConfirmOpen(true)
  }
  const confirmDeleteAction = () => {
    if (selectedBlog && selectedBlog._id) dispatch(removeBlog(selectedBlog._id))
    setConfirmOpen(false)
    setSelectedBlog(null)
  }
  const handleTrendingToggle = id => {

    dispatch(updateBlogTrending(id))
  }
  const handleViewDetails = item => {
    setDetailsData(item)
    setDetailsDialogOpen(true)
  }

  return (
    <>
      <Box className='flex items-center justify-between mb-5'>
        <Typography variant='h5'>Articles</Typography>
        <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={handleAdd}>
          Add Blog
        </Button>
      </Box>
      <Card>
        <CardContent>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-5'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value)
                // Your slice already resets page to 1 here — good.
                dispatch(setPageSize(newPageSize))
                // URL sync effect will take care of writing ?page=1&pageSize=...
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </CustomTextField>
          </div>

          {/* LOADING STATE */}
          {initialLoading && (
            <Grid container spacing={6}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                  <BlogCardShimmer />
                </Grid>
              ))}
            </Grid>
          )}

          {blog.length === 0 && !initialLoading && (
            <Box className='flex items-center justify-center my-20'>
              {' '}
              <Typography variant='body1'>No blogs available</Typography>
            </Box>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5'>
            {blog.map(item => (
              <Card key={item._id} className='border rounded bs-full'>
                <div className='relative w-full h-[200px] pt-2'>
                  {item.trending && (
                    <div className='absolute top-3 left-3 z-10'>
                      <Chip label='Trending' size='small' color='success' variant='filled' className='shadow-md' />
                    </div>
                  )}
                  <img
                    src={getFullImageUrl(item.image) || defaultImage}
                    alt={item.title}
                    className='h-full w-full object-contain'
                    onError={e => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = defaultImage
                    }}
                  />
                </div>

                <div className='flex flex-col gap-4 p-5'>
                  <div className='flex flex-col gap-1 mb-1.5'>
                    <Typography variant='h5' className=' mb-2'>
                      {`${item.title}`.toUpperCase()}
                    </Typography>
                    <Typography className='truncate'>{item.description}</Typography>
                  </div>

                  <div className='flex gap-2 flex-wrap'>
                    {item.tags?.map((tag, tIndex) => (
                      <Chip key={tIndex} label={tag} variant='tonal' size='small' sx={{ flexShrink: 0 }} />
                    ))}
                  </div>

                  <div className='flex flex-col md:flex-row justify-between items-center gap-1 text-sm text-gray-500'>
                    <span className='flex gap-2 items-center'>
                      <i className='tabler-calendar w-5 h-5' /> {formatDate(item.createdAt)}
                    </span>
                    <FormControlLabel
                      control={<Switch checked={item.trending} onChange={() => handleTrendingToggle(item._id)} />}
                      label='Trending'
                    />
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outlined'
                      color='warning'
                      startIcon={<i className='tabler-edit' />}
                      onClick={() => handleEdit(item)}
                      fullWidth
                    >
                      Edit
                    </Button>

                    <Button
                      variant='outlined'
                      color='error'
                      startIcon={<i className='tabler-trash' />}
                      onClick={() => handleDelete(item)}
                      fullWidth
                    >
                      Delete
                    </Button>

                    <Button
                      variant='outlined'
                      color='secondary'
                      startIcon={<i className='tabler-eye' />}
                      onClick={() => handleViewDetails(item)}
                      fullWidth
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className='mt-6'>
            <TablePaginationComponent
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={nextPage => {
                // Only dispatch if needed to avoid loops
                if (nextPage !== page) dispatch(setPage(nextPage))
              }}
              onPageSizeChange={nextSize => {
                if (nextSize !== pageSize) dispatch(setPageSize(nextSize)) // slice sets page=1
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* DIALOGS */}
      <BlogDialogue open={openDialog} onClose={() => setOpenDialog(false)} editData={selectedBlog} />
      <BlogDetailsDialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} data={detailsData} />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-blog'
        onConfirm={confirmDeleteAction}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default ArticlesTable
