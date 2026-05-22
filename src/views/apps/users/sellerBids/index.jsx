'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useSearchParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import { CardHeader, CircularProgress } from '@mui/material'

// Component Imports
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { useDispatch, useSelector } from 'react-redux'
import { fallbackImg, formatDate, getFullImageUrl } from '@/utils/commonfunctions'
import { setPage, setPageSize, getSellerBids } from '../../../../redux-store/slices/auctionBids'

const calculateBidIncrease = (currentBid, startingBid) => {
  const increase = ((currentBid - startingBid) / startingBid) * 100
  return increase.toFixed(1)
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const Index = () => {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const name = searchParams.get('name')

  const { sellerBids, page, pageSize, total, initialLoading, loading } = useSelector(state => state.auctionBids)

  useEffect(() => {
    dispatch(getSellerBids({ userId, page, pageSize }))
  }, [userId, name, page, pageSize])

  const getAvatar = ({ avatar, fullName }) =>
    avatar ? <CustomAvatar src={avatar} size={34} /> : <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>

  return (
    <>
      <Card>
        <CardHeader title={`${name || 'Anonymous'}'s Action Buids`} />
        <div className='p-3 md:p-6 space-y-4'>
          {sellerBids.length === 0 && loading && (
            <div className='w-fit mx-auto'>
              <CircularProgress />
            </div>
          )}
          {sellerBids.length === 0 && !loading && (
            <div>
              <Typography variant='body1' className='text-center'>
                No bids found
              </Typography>
            </div>
          )}
          {sellerBids.map((bid, index) => (
            <div
              key={bid.bidId}
              className='relative rounded-xl border bg-gradient-to-br from-card to-card/50 overflow-hidden'
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className='p-3 md:p-6'>
                <div className='flex flex-col md:flex-row gap-3 md:gap-6'>
                  {/* Product Image */}
                  <div className='flex-shrink-0'>
                    <div className='w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/20'>
                      <img
                        src={getFullImageUrl(bid.product.primaryImage) || fallbackImg}
                        alt={bid.product.title}
                        className='w-full h-full object-cover'
                        onError={e => {
                          e.currentTarget.src = fallbackImg
                        }}
                      />
                    </div>
                  </div>

                  {/* Bid Details */}
                  <div className='flex-1 space-y-4'>
                    {/* Product Info */}
                    <div className='flex justify-between'>
                      <div className='space-y-4'>
                        <h3 className='text-xl font-bold text-foreground mb-1'>{bid.product.title}</h3>
                        <p className='text-sm text-muted-foreground'>{bid.product.subTitle}</p>

                        {/* Bid Amount */}
                        <div className='flex items-center gap-6'>
                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground uppercase tracking-wide'>Current Bid</p>
                            <p className='text-3xl font-bold'>{formatCurrency(bid.currentBid)}</p>
                          </div>

                          <div className='h-12 w-px bg-border hidden md:block' />

                          <div className='space-y-1'>
                            <p className='text-xs text-muted-foreground uppercase tracking-wide'>Starting Bid</p>
                            <p className='text-lg font-semibold text-foreground'>{formatCurrency(bid.startingBid)}</p>
                          </div>

                          <div className='md:flex items-center gap-2 ml-auto hidden'>
                            <i className='tabler-trending-up' />
                            <span className='text-lg font-semibold text-success'>
                              +{calculateBidIncrease(bid.currentBid, bid.startingBid)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div className='flex gap-3 p-3 rounded-lg bg-muted/50'>
                        <div className='w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20'>
                          <img
                            src={getFullImageUrl(bid.user.profileImage) || fallbackImg}
                            alt={bid.user.name}
                            className='w-full h-full object-cover'
                            onError={e => {
                              e.currentTarget.src = fallbackImg
                            }}
                          />
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-foreground'>{bid.user.name}</p>
                          <p className='text-xs text-muted-foreground'>User</p>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-calendar' />
                        <span>{formatDate(bid.createdAt)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-calendar' /> Start Time :
                        <span>{formatDate(bid.product.auctionStartDate)}</span>
                      </div>

                      <div className='flex items-center gap-2'>
                        <i className='tabler-calendar' /> End Time :
                        <span>{formatDate(bid.product.auctionEndDate)}</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <i className='tabler-tag' /> Category :<span className='capitalize'>{bid.categoryName}</span>
                    </div>

                    {/* Attributes */}
                    {bid.product.attributes.length > 0 && (
                      <div className='flex flex-wrap gap-2 pt-2 border-t'>
                        <Chip label='Attributes' />
                        {bid.product.attributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className='flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 border border-accent/20'
                          >
                            <span className='text-xs font-medium text-accent-foreground'>{attr.name}:</span>
                            <span className='text-xs text-muted-foreground'>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={page => dispatch(setPage(page))}
              onPageSizeChange={size => dispatch(setPageSize(size))}
            />
          )}
          count={total}
          page={page - 1}
          onPageChange={(_, newPage) => dispatch(setPage(newPage + 1))}
          rowsPerPage={pageSize}
          onRowsPerPageChange={e => {
            dispatch(setPageSize(Number(e.target.value)))
            dispatch(setPage(1))
          }}
        />
      </Card>
    </>
  )
}

export default Index
