'use client'

import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'

// Util Imports
import { getLocalizedUrl } from '../../utils/i18n'
import { useDispatch, useSelector } from 'react-redux'
import { getAllBlogs } from '@/redux-store/slices/articles'
import { baseURL } from '@/utils/config'
import { FormControlLabel, Switch } from '@mui/material'

const chipColor = {
  Web: { color: 'primary' },
  Art: { color: 'success' },
  'UI/UX': { color: 'error' },
  Psychology: { color: 'warning' },
  Design: { color: 'info' }
}

const Blog = () => {
  const dispatch = useDispatch()
  const { blogs = [], total = 0 } = useSelector(state => state.blog) || {}

  // States
  const [course, setCourse] = useState('All')
  const [hideCompleted, setHideCompleted] = useState(true)
  const [filteredData, setFilteredData] = useState([])

  const [activePage, setActivePage] = useState(0)
  const limit = 6 // items per page

  const { lang: locale } = useParams()

  // Fetch blogs on mount and on page/course change
  useEffect(() => {
    const payload = {
      start: activePage + 1, // backend skip offset
      limit
      //   tag: course !== 'All' ? course : undefined
    }

    dispatch(getAllBlogs(payload))
  }, [dispatch, activePage, course])

  // Filter hideCompleted locally after fetching blogs
  useEffect(() => {
    let newData = blogs ?? []

    if (hideCompleted) {
      newData = newData.filter(blog => blog.completedTasks !== blog.totalTasks)
    }

    setFilteredData(newData)
  }, [blogs, hideCompleted])

  const handleCourseChange = e => {
    setCourse(e.target.value)
    setActivePage(0)
  }

  const handleHideCompletedChange = e => {
    setHideCompleted(e.target.checked)
    setActivePage(0)
  }

  return (
    <>
      {/* <Card> */}
      {/* <CardContent className='flex flex-col gap-6'> */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <Typography variant='h5'>Blogs</Typography>
        </div>
        {/* <div className='flex flex-wrap items-center gap-y-4 gap-x-6'>
            <FormControl fullWidth size='small' className='is-[250px] flex-auto'>
              <Select
                fullWidth
                id='select-course'
                value={course}
                onChange={handleCourseChange}
                labelId='course-select'
              >
                <MenuItem value='All'>All Courses</MenuItem>
                <MenuItem value='Web'>Web</MenuItem>
                <MenuItem value='Art'>Art</MenuItem>
                <MenuItem value='UI/UX'>UI/UX</MenuItem>
                <MenuItem value='Psychology'>Psychology</MenuItem>
                <MenuItem value='Design'>Design</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Switch onChange={handleHideCompletedChange} checked={hideCompleted} />}
              label='Hide completed'
            />
          </div> */}
      </div>

      {filteredData.length > 0 ? (
        <Grid container spacing={6}>
          {filteredData.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <div className='border rounded bs-full'>
                <div className='pli-2 pbs-2'>
                  <Link href={getLocalizedUrl('/apps/academy/course-details', locale)} className='flex'>
                    <img src={baseURL + item.image} alt={item.courseTitle} className='is-full' />
                  </Link>
                </div>
                <div className='flex flex-col gap-4 p-5'>
                  <div className='flex items-center justify-between'>
                    <Chip label={item.tags} variant='tonal' size='small' color={chipColor[item.tags].color} />
                    <div className='flex items-start'>
                      <Typography className='font-medium mie-1'>{item.rating}</Typography>
                      <i className='tabler-star-filled text-warning mie-2' />
                      <Typography>{`(${item.ratingCount})`}</Typography>
                    </div>
                  </div>

                  <div className='flex flex-col gap-1'>
                    <Typography
                      variant='h5'
                      component={Link}
                      href={getLocalizedUrl('/apps/academy/course-details', locale)}
                      className='hover:text-primary'
                    >
                      {item.courseTitle}
                    </Typography>
                    <Typography>{item.desc}</Typography>
                  </div>

                  <div className='flex flex-col gap-1'>
                    {item.completedTasks === item.totalTasks ? (
                      <div className='flex items-center gap-1'>
                        <i className='tabler-check text-xl text-success' />
                        <Typography color='success.main'>Completed</Typography>
                      </div>
                    ) : (
                      <div className='flex items-center gap-1'>
                        <i className='tabler-clock text-xl' />
                        <Typography>{`${item.time}`}</Typography>
                      </div>
                    )}
                    <LinearProgress
                      color='primary'
                      value={Math.floor((item.completedTasks / item.totalTasks) * 100)}
                      variant='determinate'
                      className='is-full bs-2'
                    />
                  </div>

                  {item.completedTasks === item.totalTasks ? (
                    <Button
                      variant='tonal'
                      startIcon={<i className='tabler-rotate-clockwise-2' />}
                      component={Link}
                      href={getLocalizedUrl('/apps/academy/course-details', locale)}
                    >
                      Start Over
                    </Button>
                  ) : (
                    <div className='flex flex-wrap gap-4'>
                      <Button
                        fullWidth
                        variant='tonal'
                        color='secondary'
                        startIcon={<i className='tabler-rotate-clockwise-2' />}
                        component={Link}
                        href={getLocalizedUrl('/apps/academy/course-details', locale)}
                        className='is-auto flex-auto'
                      >
                        Start Over
                      </Button>
                      <Button
                        fullWidth
                        variant='tonal'
                        endIcon={
                          <DirectionalIcon ltrIconClass='tabler-chevron-right' rtlIconClass='tabler-chevron-left' />
                        }
                        component={Link}
                        href={getLocalizedUrl('/apps/academy/course-details', locale)}
                        className='is-auto flex-auto'
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography className='text-center'>No blogs found</Typography>
      )}
      <div className='flex justify-center mt-6'>
        <Pagination
          count={Math.ceil(total / limit)}
          page={activePage + 1}
          showFirstButton
          showLastButton
          shape='rounded'
          variant='outlined'
          color='primary'
          onChange={(e, page) => setActivePage(page - 1)}
        />
      </div>
      {/* </CardContent> */}
      {/* </Card> */}
    </>
  )
}

export default Blog
