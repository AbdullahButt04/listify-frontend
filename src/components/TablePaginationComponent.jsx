// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

const TablePaginationComponent = ({ table, page, pageSize, total, onPageChange }) => {
  const startEntry = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endEntry = Math.min(page * pageSize, total)

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>{`Showing ${startEntry} to ${endEntry} of ${total} entries`}</Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={Math.ceil(total / pageSize)}
        page={page}
        onChange={(_, page) => onPageChange(page)}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
