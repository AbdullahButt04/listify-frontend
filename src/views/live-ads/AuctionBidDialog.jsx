'use client'

import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Typography,
  Button,
  Box,
  Divider,
  Stack,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  TextField,
  Avatar,
  CircularProgress,
  Badge
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomAvatar from '@core/components/mui/Avatar'
import { useDispatch, useSelector } from 'react-redux'
import { getAuctionBids } from '../../redux-store/slices/liveAds'
import { formatDate, getFullImageUrl } from '@/utils/commonfunctions'

// Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const formatCurrency = amount => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const calculateBidIncrease = (current, starting) => {
  return (((current - starting) / starting) * 100).toFixed(1)
}

const AuctioBidDialog = ({ open, onClose, ad }) => {
  const dispatch = useDispatch()

  const { adBids, bidsLoading } = useSelector(state => state.liveAds)

  useEffect(() => {
    if (open && ad) {
      dispatch(getAuctionBids({ adId: ad._id, start: 1, limit: 20 }))
    }
  }, [dispatch, open, ad])

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='lg'
      PaperProps={{ sx: { overflow: 'visible', width: '650px', maxWidth: '95vw' } }}
    >
      <DialogTitle sx={{ pr: 10 }}>
        <Typography variant='h5' component='span'>
          Auction Bids
        </Typography>

        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <div className='space-y-4'>
          {bidsLoading && (
            <div className='w-fit mx-auto'>
              <CircularProgress />
            </div>
          )}

          {bidsLoading === false && adBids.length === 0 && (
            <div className='w-fit mx-auto'>
              <Typography variant='span'>No bids found</Typography>
            </div>
          )}

          {adBids?.map((bid, index) => (
            <div
              key={bid._id}
              className='p-4 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-all duration-300 relative overflow-hidden'
            >
              {!bid.isWinningBid && (
                <div className='absolute top-2 right-2'>
                  <Badge className='bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0'>
                    <i className='tabler-trending-up w-3 h-3 mr-1' />
                    Winning Bid
                  </Badge>
                </div>
              )}

              <div className='flex flex-col md:flex-row items-start gap-4'>
                {/* Bidder Info */}
                <div className='flex items-center gap-3 flex-1'>
                  <CustomAvatar src={getFullImageUrl(bid.user.profileImage)} alt={bid.user.name} />

                  <div>
                    <p className='font-semibold text-foreground'>{bid.user.name}</p>
                    <p className='text-sm text-muted-foreground'>Bidder</p>
                  </div>
                </div>

                {/* Bid Amount */}
                <div className='text-right'>
                  <div className='flex items-center gap-2 justify-end'>
                    <i className='tabler-trending-up text-base' />
                    <Typography variant='h5' color='primary' fontWeight='bold'>
                      {formatCurrency(bid.currentBid)}
                    </Typography>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    +{calculateBidIncrease(bid.currentBid, bid.startingBid)} % from starting
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className='mt-4 pt-4 border-t border-border/30 flex flex-col md:flex-row md:items-center justify-between text-sm gap-2'>
                <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <div>
                    <span className='text-muted-foreground'>Starting Bid: </span>
                    <span className='font-semibold text-foreground'>{formatCurrency(bid.startingBid)}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>Seller: </span>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar
                        src={getFullImageUrl(bid.seller.profileImage)}
                        alt={bid.seller.name}
                        className='w-7 h-7'
                      />

                      <span className='font-medium text-foreground'>{bid.seller.name}</span>
                    </div>
                  </div>
                </div>
                <p className='text-muted-foreground'>{formatDate(bid.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuctioBidDialog
