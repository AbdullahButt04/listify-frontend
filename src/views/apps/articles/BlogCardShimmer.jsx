import React from 'react'
import { useTheme } from '@mui/material/styles'

const BlogCardShimmer = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Background colors based on theme
  const baseBg = isDark ? 'bg-[#25293C]' : 'bg-gray-200';
  const containerBg = isDark ? 'bg-gray-700' : 'bg-white'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'

  return (
    <div className={`border ${borderColor} rounded overflow-hidden shadow ${containerBg}`}>
      {/* IMAGE */}
      <div className={`relative w-full h-[200px] ${baseBg} animate-pulse`} />

      {/* CONTENT */}
      <div className='p-5 flex flex-col gap-4'>
        {/* Title */}
        <div className={`h-6 w-4/5 rounded ${baseBg} animate-pulse`} />

        {/* Description */}
        <div className={`h-4 w-full rounded ${baseBg} animate-pulse`} />

        {/* Tags row */}
        <div className='flex gap-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-6 w-14 rounded-full ${baseBg} animate-pulse`} />
          ))}
        </div>

        {/* Date + switch row */}
        <div className='flex justify-between items-center'>
          <div className={`h-4 w-24 rounded ${baseBg} animate-pulse`} />
          <div className={`h-5 w-12 rounded ${baseBg} animate-pulse`} />
        </div>

        {/* Action buttons row */}
        <div className='flex gap-2'>
          <div className={`flex-1 h-10 rounded ${baseBg} animate-pulse`} />
          <div className={`flex-1 h-10 rounded ${baseBg} animate-pulse`} />
          <div className={`flex-1 h-10 rounded ${baseBg} animate-pulse`} />
        </div>
      </div>
    </div>
  )
}

export default BlogCardShimmer
