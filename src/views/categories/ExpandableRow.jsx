import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, CircularProgress, IconButton, Switch, Tooltip, Typography, Collapse } from '@mui/material'
import { getSubCategories, clearSubCategoriesForParent, toggleCategoryStatus } from '@/redux-store/slices/categories'
import { fallbackImg, getFullImageUrl } from '@/utils/commonfunctions'
import classnames from 'classnames'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const formatDate = iso => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const ExpandableRow = ({ category, level = 0, onEdit, onDelete, columnCount }) => {
  const dispatch = useDispatch()
  const [isExpanded, setIsExpanded] = useState(false)
  const subCategoriesMap = useSelector(state => state.categories.subCategoriesMap)
  const { profileData } = useSelector(state => state.adminSlice)


  const categoryId = category._id
  const subcategoryData = subCategoriesMap[categoryId] || { data: [], loading: false, total: 0 }
  const { data: subCategories, loading, total } = subcategoryData

  // For root categories, use subcategoryCount. For nested subcategories, we need to fetch to check
  const hasKnownSubcategories = category.subcategoryCount !== undefined && category.subcategoryCount > 0
  const hasFetchedData = subcategoryData.data.length > 0 || total > 0

  // Show expand icon if: 1) has known subcategories, 2) has fetched data, or 3) is a subcategory (might have children)
  const showExpandIcon = hasKnownSubcategories || hasFetchedData || level > 0

  const handleToggleExpand = () => {
    if (!isExpanded && !loading) {
      // Fetch subcategories when expanding (only if not already loaded)
      if (subcategoryData.data.length === 0) {
        dispatch(getSubCategories({ parentId: categoryId, start: 1, limit: 100 }))
      }
    }
    setIsExpanded(!isExpanded)
  }

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (categoryId) {
        dispatch(clearSubCategoriesForParent(categoryId))
      }
    }
  }, [categoryId, dispatch])

  const paddingLeft = level * 40

  return (
    <>
      {/* Main Row */}
      <tr className={classnames({ selected: false })}>
        {/* Name column with expand icon and indentation */}
        <td>
          <Box className='flex items-center gap-2' style={{ paddingLeft: `${paddingLeft}px` }}>
            {showExpandIcon ? (
              <IconButton size='small' onClick={handleToggleExpand} className='min-w-[32px]' disabled={loading}>
                {loading && !isExpanded ? (
                  <CircularProgress size={16} />
                ) : (
                  <i className={classnames(isExpanded ? 'tabler-chevron-down' : 'tabler-chevron-right')} />
                )}
              </IconButton>
            ) : (
              <Box className='min-w-[32px]' />
            )}
            <img
              src={getFullImageUrl(category.image)}
              alt='Category'
              className='w-10 h-10 object-cover rounded'
              onError={e => {
                e.target.src = fallbackImg
              }}
            />
            <Typography color='text.primary' className='font-medium'>
              {category.name}
            </Typography>
          </Box>
        </td>

        {/* Slug */}
        <td>
          <Typography color='text.primary' className='font-medium'>
            {category.slug}
          </Typography>
        </td>

        {/* Status */}
        <td>
          <Switch
            checked={category.isActive}
            onChange={() => {

              dispatch(toggleCategoryStatus(category._id))
            }}
          />
        </td>

        {/* Subcategory Count */}
        <td>
          <Typography color='text.primary' className='font-medium text-center'>
            {category.subcategoryCount !== undefined ? category.subcategoryCount : total > 0 ? total : 0}
          </Typography>
        </td>

        {/* Custom Field Count */}
        <td>
          <Typography color='text.primary' className='font-medium text-center'>
            {category.customFieldCount || 0}
          </Typography>
        </td>

        {/* Created */}
        <td>
          <Typography color='text.primary' className='font-medium'>
            {formatDate(category.createdAt)}
          </Typography>
        </td>

        {/* Updated */}
        <td>
          <Typography color='text.primary' className='font-medium'>
            {formatDate(category.updatedAt)}
          </Typography>
        </td>

        {/* Actions */}
        <td>
          <div className='flex items-center gap-2'>
            <Tooltip title='Edit Category'>
              <IconButton size='small' onClick={() => onEdit(category)}>
                <i className='tabler-edit' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete Category'>
              <IconButton size='small' onClick={() => onDelete(category)}>
                <i className='tabler-trash' />
              </IconButton>
            </Tooltip>
          </div>
        </td>
      </tr>

      {/* Expanded Subcategories */}
      {isExpanded && (
        <>
          {loading && (
            <tr>
              <td colSpan={columnCount}>
                <Box className='flex justify-center items-center py-4' style={{ paddingLeft: `${paddingLeft + 40}px` }}>
                  <CircularProgress size={24} />
                  <Typography className='ml-2'>Loading subcategories...</Typography>
                </Box>
              </td>
            </tr>
          )}

          {!loading && subCategories.length === 0 && (
            <tr>
              <td colSpan={columnCount}>
                <Box className='py-4' style={{ paddingLeft: `${paddingLeft + 40}px` }}>
                  <Typography color='text.secondary' className='italic'>
                    No subcategories found
                  </Typography>
                </Box>
              </td>
            </tr>
          )}

          {!loading &&
            subCategories.length > 0 &&
            subCategories.map(subCategory => (
              <ExpandableRow
                key={subCategory._id}
                category={subCategory}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                columnCount={columnCount}
              />
            ))}
        </>
      )}
    </>
  )
}

export default ExpandableRow
