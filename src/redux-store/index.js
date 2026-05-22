// Third-party Imports
import { configureStore } from '@reduxjs/toolkit'

// Slice Imports
import helpReducer from '@/redux-store/slices/help'
import articlesReducer from '@/redux-store/slices/articles'
import bannerSlice from '@/redux-store/slices/banner'
import currencyReducer from '@/redux-store/slices/currency'
import adminSlice from '@/redux-store/slices/admin'
import reportReasonsReducer from '@/redux-store/slices/reportReasons'
import blogReducer from '@/redux-store/slices/blog'
import tipSlice from '@/redux-store/slices/Tip'
import subScriptionPlan from '@/redux-store/slices/subscriptionPlan'
import purchaseHistorySlice from '@/redux-store/slices/purchaseHistory'
import idProofSlice from '@/redux-store/slices/idProof'
import featureAdSlice from '@/redux-store/slices/feature'
import reportSlice from '@/redux-store/slices/report'
import settingSlice from '@/redux-store/slices/setting'
import countriesSlice from '@/redux-store/slices/countries'
import stateSlice from '@/redux-store/slices/states'
import citiesSlice from '@/redux-store/slices/cities'
import userSlice from '@/redux-store/slices/user'
import reviewSlice from '@/redux-store/slices/review'
import dashboardSlice from '@/redux-store/slices/dashboard'
import verificationSlice from '@/redux-store/slices/verification'
import categorySlice from '@/redux-store/slices/categories'
import attributesSlice from '@/redux-store/slices/attributes'
import liveAdsSlice from '@/redux-store/slices/liveAds'
import notificationSlice from '@/redux-store/slices/notification'
import roleSlice from '@/redux-store/slices/role'
import staffSlice from '@/redux-store/slices/staff'
import adVideoSlice from '@/redux-store/slices/adVideo'
import auctionBidSlice from '@/redux-store/slices/auctionBids'

export const store = configureStore({
  reducer: {
    adminSlice,
    help: helpReducer,
    blog: articlesReducer,
    banner: bannerSlice,
    currency: currencyReducer,
    reportReasons: reportReasonsReducer,
    blog: blogReducer,
    tips: tipSlice,
    subScriptionPlan: subScriptionPlan,
    purchaseHistory: purchaseHistorySlice,
    idProof: idProofSlice,
    feature: featureAdSlice,
    report: reportSlice,
    setting: settingSlice,
    countries: countriesSlice,
    states: stateSlice,
    cities: citiesSlice,
    users: userSlice,
    review: reviewSlice,
    dashboard: dashboardSlice,
    verification: verificationSlice,
    categories: categorySlice,
    attributes: attributesSlice,
    liveAds: liveAdsSlice,
    notification: notificationSlice,
    role: roleSlice,
    staff: staffSlice,
    adVideos: adVideoSlice,
    auctionBids: auctionBidSlice
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
})
