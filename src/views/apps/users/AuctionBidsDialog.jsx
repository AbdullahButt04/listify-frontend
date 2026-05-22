'use client'

import React, { forwardRef, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Slide,
  Avatar,
  Box,
  Card,
  CardContent,
  Badge,
  Chip,
  CircularProgress
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { useDispatch, useSelector } from 'react-redux'
import { getUserBids } from '../../../redux-store/slices/user'
import { format } from 'date-fns'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AuctionBidsDialog = ({ open, onClose, bids = [], user = null }) => {
  const dispatch = useDispatch()

  const { userBids, loading } = useSelector(state => state.users)

  useEffect(() => {
    if (open && user) {
      dispatch(getUserBids(user?._id))
    }
  }, [dispatch, user, open])

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = dateString => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  const calculateBidIncrease = (currentBid, startingBid) => {
    const increase = ((currentBid - startingBid) / startingBid) * 100
    return increase.toFixed(1)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      closeAfterTransition={false}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '800px',
          maxWidth: '95vw',
          margin: 'auto',
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span' color='primary'>
          {user?.name}'s Bids List
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <Box
            component='span'
            sx={{
              fontSize: '1.5rem',
              color: 'text.primary',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <i className='tabler-x' />
          </Box>
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className='p-3 md:p-6 space-y-4'>
          {userBids.length === 0 && loading && (
            <div className='w-fit mx-auto'>
              <CircularProgress />
            </div>
          )}
          {userBids.length === 0 && !loading && (
            <div>
              <Typography variant='body1' className='text-center'>
                No bids found
              </Typography>
            </div>
          )}
          {userBids.map((bid, index) => (
            <div
              key={bid.bidId}
              className='relative rounded-xl border bg-gradient-to-br from-card to-card/50 overflow-hidden'
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Bid Number Badge */}
              <div className='absolute top-4 right-4 z-10 flex flex-col gap-3'>
                <Chip variant='tonel' label={`Bid #${index + 1}`} className='' />
                <div className='md:hidden items-center gap-2 ml-auto flex'>
                  <i className='tabler-trending-up text-base' />
                  <span className='text-sm font-semibold text-success'>
                    +{calculateBidIncrease(bid.currentBid, bid.startingBid)}%
                  </span>
                </div>
              </div>

              <div className='p-3 md:p-6'>
                <div className='flex flex-col md:flex-row gap-3 md:gap-6'>
                  {/* Product Image */}
                  <div className='flex-shrink-0'>
                    <div className='w-32 h-32 rounded-lg overflow-hidden border-2 border-primary/20'>
                      <img
                        src={getFullImageUrl(bid.product.primaryImage)}
                        alt={bid.product.title}
                        className='w-full h-full object-cover'
                        onError={e => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    </div>
                  </div>

                  {/* Bid Details */}
                  <div className='flex-1 space-y-4'>
                    {/* Product Info */}
                    <div>
                      <h3 className='text-xl font-bold text-foreground mb-1'>{bid.product.title}</h3>
                      <p className='text-sm text-muted-foreground'>{bid.product.subTitle}</p>
                    </div>

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

                    {/* Seller Info */}
                    <div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
                      <div className='w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20'>
                        <img
                          src={getFullImageUrl(bid.seller.profileImage)}
                          alt={bid.seller.name}
                          className='w-full h-full object-cover'
                          onError={e => {
                            e.currentTarget.src = '/placeholder.svg'
                          }}
                        />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-foreground'>{bid.seller.name}</p>
                        <p className='text-xs text-muted-foreground'>Seller</p>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-calendar' />
                        <span>{formatDate(bid.createdAt)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-tag' />
                        <span className='capitalize'>{bid.categoryName}</span>
                      </div>
                    </div>

                    {/* Attributes */}
                    {bid.product.attributes.length > 0 && (
                      <div className='flex flex-wrap gap-2 pt-2 border-t'>
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
      </DialogContent>
    </Dialog>
  )
}

export default AuctionBidsDialog
