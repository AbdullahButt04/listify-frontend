'use client'

import React from 'react';
import { forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Switch,
  Slide
} from '@mui/material';
import { getFullImageUrl } from '@/utils/commonfunctions';
import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />;
});

const BlogDetailsDialog = ({ open, onClose, data }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span'>
          {data?.title || 'Blog Details'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        {/* Image */}
        {data?.image && (
          <Box
            component="img"
            src={getFullImageUrl(data.image)}
            alt={data?.title || 'Blog Image'}
            sx={{
              width: '100%',
              height: 200,
              objectFit: 'contain',
              borderRadius: 1,
              mb: 3,
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0'
            }}
            onError={e => {
              e.target.src = '/defaultImage.jpg';
            }}
          />
        )}

        {/* Description */}
        <Typography variant="subtitle1" fontWeight={100} gutterBottom>
          Description:
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
          {data?.description || '-'}
        </Typography>

        {/* Published Date */}
        <Typography variant="subtitle1" fontWeight={100} gutterBottom>
          Published:
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {data?.createdAt
            ? new Date(data.createdAt).toLocaleDateString()
            : '-'}
        </Typography>

        {/* Trending Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={100} sx={{ mr: 1 }}>
            Trending:
          </Typography>
          <Switch checked={data?.trending || false} disabled />
        </Box>

        {/* Tags */}
        <Typography variant="subtitle1" fontWeight={100} gutterBottom>
          Tags:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
          {data?.tags?.length > 0 ? (
            data.tags.map((tag, i) => (
              <Chip key={i} label={tag} size="small" variant="outlined" />
            ))
          ) : (
            <Typography variant="body2">No tags</Typography>
          )}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions className='px-6 py-2.5'>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlogDetailsDialog;
