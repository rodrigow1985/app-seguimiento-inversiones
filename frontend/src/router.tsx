import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/layout/RootLayout'

const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'))
const TradingPage = lazy(() => import('@/modules/trading/TradingPage'))
const PositionDetailPage = lazy(() => import('@/modules/trading/PositionDetailPage'))
const DcaPage = lazy(() => import('@/modules/dca/DcaPage'))
const DcaStrategyDetailPage = lazy(() => import('@/modules/dca/DcaStrategyDetailPage'))
const ConfigPage = lazy(() => import('@/modules/config/ConfigPage'))
const CclPage = lazy(() => import('@/modules/ccl/CclPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: withSuspense(DashboardPage) },
      { path: 'trading', element: withSuspense(TradingPage) },
      { path: 'trading/:positionId', element: withSuspense(PositionDetailPage) },
      { path: 'dca', element: withSuspense(DcaPage) },
      { path: 'dca/:strategyId', element: withSuspense(DcaStrategyDetailPage) },
      { path: 'config', element: withSuspense(ConfigPage) },
      { path: 'ccl', element: withSuspense(CclPage) },
    ],
  },
])
