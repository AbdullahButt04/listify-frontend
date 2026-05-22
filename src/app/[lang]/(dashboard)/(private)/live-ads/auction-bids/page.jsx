'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { CircularProgress, Typography, Box, Divider, Card, MenuItem, Chip } from '@mui/material'
import CustomAvatar from '@core/components/mui/Avatar'
import { formatDate, getFullImageUrl } from '@/utils/commonfunctions'
import { getAuctionBids, setPage, setPageSize } from '@/redux-store/slices/liveAds'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import CustomTextField from '@/@core/components/mui/TextField'

const formatCurrency = amount => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const calculateBidIncrease = (current, starting) => {
  return (((current - starting) / starting) * 100).toFixed(1)
}

const AuctionBids = () => {
  const searchParams = useSearchParams()
  const adId = searchParams.get('adId')
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch()

  const { adBids, bidsLoading, page, pageSize, total } = useSelector(state => state.liveAds)

  const [hydratedFromUrl, setHydratedFromUrl] = useState(false)

  // On mount, read page and size from URL and sync to redux
  useEffect(() => {
    if (hydratedFromUrl) return
    const p = Number(searchParams.get('page')) || 1
    const s = Number(searchParams.get('size')) || 10
    dispatch(setPage(p))
    dispatch(setPageSize(s))
    setHydratedFromUrl(true)
  }, [searchParams, hydratedFromUrl, dispatch])

  // Update URL query params when page or pageSize changes after hydration
  useEffect(() => {
    if (!hydratedFromUrl) return
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', page.toString())
    params.set('size', pageSize.toString())
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [page, pageSize, hydratedFromUrl, router, pathname, searchParams])

  useEffect(() => {
    if (!hydratedFromUrl || !adId) return
    dispatch(getAuctionBids({ adId, start: page, limit: pageSize }))
  }, [page, pageSize, hydratedFromUrl, adId, dispatch])

  if (bidsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!bidsLoading && adBids.length === 0) {
    return (
      <Typography variant='h6' align='center' sx={{ mt: 4 }}>
        No bids found
      </Typography>
    )
  }

  return (
    <>
      <Typography variant='h4' gutterBottom>
        Auction Bids
      </Typography>

      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center py-4 px-6 border-bs gap-4'>
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
        <Box sx={{ mx: 'auto' }} className='px-4 pb-2'>
          {adBids.map(bid => (
            <Box
              key={bid._id}
              sx={{
                p: 3,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                position: 'relative',
                bgcolor: 'background.paper'
              }}
            >
              {/* {!bid.isWinningBid && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 8,
                    bgcolor: 'warning.main',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 12
                  }}
                >
                  Winning Bid
                </Box>
              )} */}

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
                {/* Bidder info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                  <CustomAvatar src={getFullImageUrl(bid.user.profileImage)} alt={bid.user.name} />
                  <Box>
                    <Typography variant='h6' fontWeight='bold'>
                      {bid.user.name}
                    </Typography>
                    <div className='flex items-center gap-8'>
                      <Typography variant='body1' color='text.secondary'>
                        Bidder
                      </Typography>
                      <Box className='flex items-center gap-1'>
                        <Typography component='span' color='text.secondary'>
                          Starting Bid :{' '}
                        </Typography>
                        <Typography component='span' fontWeight='medium'>
                          {formatCurrency(bid.startingBid)}
                        </Typography>
                      </Box>
                    </div>
                  </Box>
                </Box>

                {/* Bid Amount */}
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <i className='tabler-trending-up' style={{ fontSize: 20 }} />
                    <Typography variant='h5' color='primary' fontWeight='bold'>
                      {formatCurrency(bid.currentBid)}
                    </Typography>
                  </Box>
                  <Typography color='text.secondary' variant='body1'>
                    + {calculateBidIncrease(bid.currentBid, bid.startingBid)} % from starting
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Additional info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 14
                }}
              >
                <Box className='flex items-center gap-6 flex-wrap'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography component='span' color='text.secondary'>
                      Seller :{' '}
                    </Typography>
                    <CustomAvatar
                      src={getFullImageUrl(bid.seller.profileImage)}
                      alt={bid.seller.name}
                      sx={{ width: 28, height: 28 }}
                    />
                    <Typography fontWeight='medium'>{bid.seller.name}</Typography>
                  </Box>
                  {bid.isWinningBid && <Chip label='Winning' color='success' size='small' variant='tonal' />}
                </Box>

                <Typography color='text.secondary'>{formatDate(bid.createdAt)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <TablePaginationComponent
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={page => dispatch(setPage(page))}
          onPageSizeChange={size => {
            dispatch(setPageSize(size))
            dispatch(setPage(1))
          }}
        />
      </Card>
    </>
  )
}

export default AuctionBids
