'use client'

// React Imports
import { Fragment, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'

const ConfirmationDialog = ({ open, setOpen, type, onConfirm }) => {
  // States
  const [secondDialog, setSecondDialog] = useState(false)
  const [userInput, setUserInput] = useState(false)

  // Vars
  const Wrapper = type === 'suspend-account' ? 'div' : Fragment

  const handleSecondDialogClose = () => {
    setSecondDialog(false)
    setOpen(false)
  }

  const handleConfirmation = value => {
    setUserInput(value)
    if (value && onConfirm) onConfirm()
    setSecondDialog(true)
    setOpen(false)
  }

  return (
    <>
      <Dialog fullWidth maxWidth='xs' open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i className='tabler-alert-circle text-[88px] mbe-6 text-warning' />
          <Wrapper
            {...(type === 'suspend-account' && {
              className: 'flex flex-col items-center gap-2'
            })}
          >
            <Typography variant='h5'>
              {type === 'delete-account' && 'Are you sure you want to deactivate your account?'}
              {type === 'unsubscribe' && 'Are you sure to cancel your subscription?'}
              {type === 'suspend-account' && 'Are you sure?'}
              {type === 'delete-order' && 'Are you sure?'}
              {type === 'delete-customer' && 'Are you sure?'}
              {type === 'delete-FAQs' && 'Are you sure you want to delete this FAQ?'}
              {type === 'delete-banner' && 'Are you sure you want to delete this banner?'}
              {type === 'delete-currency' && 'Are you sure you want to delete this currency?'}
              {type === 'delete-reason' && 'Are you sure you want to delete this reason?'}
              {type === 'delete-blog' && 'Are you sure you want to delete this blog?'}
              {type === 'delete-tip' && 'Are you sure you want to delete this tip?'}
              {type === 'delete-subscription-plan' && 'Are you sure you want to delete this subscription plan?'}
              {type === 'delete-id-proof' && 'Are you sure you want to delete this Id Proof?'}
              {type === 'delete-feature-ad' && 'Are you sure you want to delete this Feature Advertisement ?'}
              {type === 'delete-review' && 'Are you sure you want to delete this review ?'}
              {type === 'approve-verification' && 'Are you sure you want to approve this verification request?'}
              {type === 'delete-category' && 'Are you sure you?'}
              {type === 'delete-notification' && 'Are you sure you?'}
              {type === 'delete-attribute' && 'Are you sure you want to delete?'}
              {type === 'delete-country' && 'Are you sure you want to delete?'}
              {type === 'delete-state' && 'Are you sure you want to delete?'}
              {type === 'delete-city' && 'Are you sure you want to delete?'}
              {type === 'delete-Ad' && 'Are you sure you want to delete?'}
              {type === 'delete-staff' && 'Are you sure you want to delete?'}
              {type === 'delete-advideo' && 'Are you sure you want to delete?'}
              {type === 'delete-report' && 'Are you sure you want to delete?'}
              {type === 'solve-report' && 'Are you sure you want to solve?'}
              {type === 'logout' && 'Are you sure you want to logout?'}
            </Typography>
            {type === 'suspend-account' && (
              <Typography color='text.primary'>You won&#39;t be able to revert user!</Typography>
            )}
            {type === 'delete-order' && (
              <Typography color='text.primary'>You won&#39;t be able to revert order!</Typography>
            )}
            {type === 'delete-customer' && (
              <Typography color='text.primary'>You won&#39;t be able to revert customer!</Typography>
            )}
            {type === 'delete-FAQs' && (
              <Typography color='text.primary'>You won't be able to revert this FAQ deletion!</Typography>
            )}
            {type === 'delete-banner' && (
              <Typography color='text.primary'>You won't be able to revert this banner deletion!</Typography>
            )}
            {type === 'delete-currency' && (
              <Typography color='text.primary'>You won't be able to revert this banner deletion!</Typography>
            )}
            {type === 'delete-reason' && (
              <Typography color='text.primary'>You won't be able to revert this reason deletion!</Typography>
            )}
            {type === 'delete-blog' && (
              <Typography color='text.primary'>You won't be able to revert this blog deletion!</Typography>
            )}
            {type === 'delete-tip' && (
              <Typography color='text.primary'>You won't be able to revert this tip deletion!</Typography>
            )}
            {type === 'delete-subscription-plan' && (
              <Typography color='text.primary'>You won't be able to revert this subscription plan deletion!</Typography>
            )}
            {type === 'delete-id-proof' && (
              <Typography color='text.primary'>You won't be able to revert this Id Proof deletion!</Typography>
            )}
            {type === 'delete-feature-ad' && (
              <Typography color='text.primary'>
                You won't be able to revert this Feature Advertisement deletion!
              </Typography>
            )}

            {type === 'delete-review' && (
              <Typography color='text.primary'>You won't be able to revert this Review deletion!</Typography>
            )}
            {type === 'approve-verification' && (
              <Typography color='text.primary'>You won't be able to revert this Verification approval!</Typography>
            )}
            {type === 'delete-category' && (
              <Typography color='text.primary'>You won't be able to revert this Category!</Typography>
            )}
            {type === 'delete-notification' && (
              <Typography color='text.primary'>You won't be able to revert this Notification!</Typography>
            )}
            {type === 'delete-attribute' && (
              <Typography color='text.primary'>You won't be able to revert this Attribute deletion!</Typography>
            )}
            {type === 'delete-country' && (
              <Typography color='text.primary'>You won't be able to revert this Country deletion!</Typography>
            )}
            {type === 'delete-state' && (
              <Typography color='text.primary'>You won't be able to revert this State deletion!</Typography>
            )}
            {type === 'delete-city' && (
              <Typography color='text.primary'>You won't be able to revert this City deletion!</Typography>
            )}
            {type === 'delete-Ad' && (
              <Typography color='text.primary'>You won't be able to revert this Live Ad deletion!</Typography>
            )}
            {type === 'delete-staff' && (
              <Typography color='text.primary'>You won't be able to revert the staff!</Typography>
            )}
            {type === 'delete-advideo' && (
              <Typography color='text.primary'>You won't be able to revert the staff!</Typography>
            )}
            {type === 'delete-report' && (
              <Typography color='text.primary'>You won't be able to revert the report!</Typography>
            )}
            {type === 'solve-report' && (
              <Typography color='text.primary'>You won't be able to revert the report!</Typography>
            )}
          </Wrapper>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' onClick={() => handleConfirmation(true)}>
            {type === 'suspend-account'
              ? 'Yes, Suspend User!'
              : type === 'delete-order'
                ? 'Yes, Delete Order!'
                : type === 'delete-customer'
                  ? 'Yes, Delete Customer!'
                  : type === 'delete-FAQs'
                    ? 'Yes, Delete FAQ!'
                    : type === 'delete-currency'
                      ? 'Yes, Delete Currency!'
                      : type === 'delete-banner'
                        ? 'Yes, Delete banner!'
                        : type === 'delete-reason'
                          ? 'Yes, Delete reason!'
                          : type === 'delete-blog'
                            ? 'Yes, Delete blog!'
                            : type === 'delete-tip'
                              ? 'Yes, Delete tip!'
                              : type === 'delete-subscription-plan'
                                ? 'Yes, Delete plan!'
                                : type === 'delete-id-proof'
                                  ? 'Yes, Delete Proof!'
                                  : type === 'delete-feature-ad'
                                    ? 'Yes, Delete Feature!'
                                    : type === 'mark-as-solved'
                                      ? 'Yes, Mark as Solved!'
                                      : type === 'delete-review'
                                        ? 'Yes, Delete Review!'
                                        : type === 'approve-verification'
                                          ? 'Yes, Approve!'
                                          : type === 'delete-category'
                                            ? 'Yes, Delete Category!'
                                            : type === 'delete-notification'
                                              ? 'Yes, Delete Notification!'
                                              : type === 'delete-attribute'
                                                ? 'Yes, Delete Attribute!'
                                                : type === 'delete-country'
                                                  ? 'Yes, Delete Country!'
                                                  : type === 'delete-state'
                                                    ? 'Yes, Delete State!'
                                                    : type === 'delete-city'
                                                      ? 'Yes, Delete City!'
                                                      : type === 'delete-Ad'
                                                        ? 'Yes, Delete Live Ad!'
                                                        : type === 'delete-staff'
                                                          ? 'Yes, Delete Staff!'
                                                          : type === 'delete-advideo'
                                                            ? 'Yes, Delete advideo!'
                                                            : type === 'delete-report'
                                                              ? 'Yes, Delete report!'
                                                              : type === 'solve-report'
                                                                ? 'Yes, Solve report!'
                                                                : type === 'logout'
                                                                  ? 'Yes, Logout!'
                                                                  : 'Yes'}
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              handleConfirmation(false)
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={secondDialog} onClose={handleSecondDialogClose} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i
            className={classnames('text-[88px] mbe-6', {
              'tabler-circle-check': userInput,
              'text-success': userInput,
              'tabler-circle-x': !userInput,
              'text-error': !userInput
            })}
          />
          <Typography variant='h6' className='mbe-2'>
            {userInput
              ? `${type === 'solve-report' ? 'Solved' : type === 'approve-verification' ? 'Approve' : type === 'delete-account' ? 'Deactivated' : type === 'unsubscribe' ? 'Unsubscribed' : type === 'delete-order' || 'delete-customer' ? 'Deleted' : type === 'delete-FAQs' ? 'Deleted' : 'Suspended!'}`
              : 'Cancelled'}
          </Typography>
          <Typography color='text.primary'>
            {userInput ? (
              <>
                {type === 'delete-account' && 'Your account has been deactivated successfully.'}
                {type === 'unsubscribe' && 'Your subscription cancelled successfully.'}
                {type === 'suspend-account' && 'User has been suspended.'}
                {type === 'delete-order' && 'Your order deleted successfully.'}
                {type === 'delete-customer' && 'Your customer removed successfully.'}
                {type === 'delete-FAQs' && 'The FAQ has been deleted successfully.'}
                {type === 'delete-currency' && 'The Currency has been deleted successfully.'}
                {type === 'delete-banner' && 'The banner has been deleted successfully.'}
                {type === 'delete-reason' && 'The reason has been deleted successfully.'}
                {type === 'delete-blog' && 'The blog has been deleted successfully.'}
                {type === 'delete-tip' && 'The tip has been deleted successfully.'}
                {type === 'delete-subscription-plan' && 'The subscription plan has been deleted successfully.'}
                {type === 'delete-id-proof' && 'The Id Proof has been deleted successfully.'}
                {type === 'delete-feature-ad' && 'The Feature Advertisement has been deleted successfully.'}
                {type === 'mark-as-solved' && 'The issue has been marked as solved successfully.'}

                {type === 'delete-review' && 'The Review has been deleted successfully.'}
                {type === 'approve-verification' && 'The verification request has been approved successfully.'}
                {type === 'delete-category' && 'The category has been deleted successfully.'}
                {type === 'delete-notification' && 'The Notification has been deleted successfully.'}
                {type === 'delete-attribute' && 'The attribute has been deleted successfully.'}
                {type === 'delete-country' && 'The Country has been deleted successfully.'}
                {type === 'delete-state' && 'The State has been deleted successfully.'}
                {type === 'delete-city' && 'The City has been deleted successfully.'}
                {type === 'delete-Ad' && 'The Live Ad has been deleted successfully.'}
                {type === 'delete-staff' && 'The Staff has been deleted successfully.'}
                {type === 'delete-advideo' && 'The advideo has been deleted successfully.'}
                {type === 'delete-report' && 'The report has been deleted successfully.'}
                {type === 'solve-report' && 'The report has been solved successfully.'}
                {type === 'logout' && 'You have been logged out successfully.'}
              </>
            ) : (
              <>
                {type === 'delete-account' && 'Account Deactivation Cancelled!'}
                {type === 'unsubscribe' && 'Unsubscription Cancelled!!'}
                {type === 'suspend-account' && 'Cancelled Suspension :)'}
                {type === 'delete-order' && 'Order Deletion Cancelled'}
                {type === 'delete-customer' && 'Customer Deletion Cancelled'}
                {type === 'delete-FAQs' && 'FAQ deletion cancelled.'}
                {type === 'delete-currency' && 'Currency deletion cancelled.'}
                {type === 'delete-banner' && 'banner deletion cancelled.'}
                {type === 'delete-reason' && 'reason deletion cancelled.'}
                {type === 'delete-blog' && 'blog deletion cancelled.'}
                {type === 'delete-tip' && 'tip deletion cancelled.'}
                {type === 'delete-subscription-plan' && 'subscription plan deletion cancelled.'}
                {type === 'delete-id-proof' && 'Id Proof deletion cancelled.'}
                {type === 'delete-feature-ad' && 'Feature Advertisement deletion cancelled.'}
                {type === 'mark-as-solved' && 'Mark as Solved Cancelled.'}

                {type === 'delete-review' && 'Review deletion cancelled.'}
                {type === 'approve-verification' && 'Verification approval cancelled.'}
                {type === 'delete-category' && 'Category deletion cancelled.'}
                {type === 'delete-notification' && 'Notification deletion cancelled.'}
                {type === 'delete-attribute' && 'Attribute deletion cancelled.'}
                {type === 'delete-country' && 'Country deletion cancelled.'}
                {type === 'delete-state' && 'State deletion cancelled.'}
                {type === 'delete-city' && 'City deletion cancelled.'}
                {type === 'delete-Ad' && 'Live Ad deletion cancelled.'}
                {type === 'delete-staff' && 'Staff deletion cancelled.'}
                {type === 'delete-advideo' && 'advideo deletion cancelled.'}
                {type === 'delete-report' && 'report deletion cancelled.'}
                {type === 'solve-report' && 'report solve cancelled.'}
                {type === 'logout' && 'logout cancelled.'}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' color={userInput ? 'success' : 'secondary'} onClick={handleSecondDialogClose}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmationDialog
