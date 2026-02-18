import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ScenarioPage from './pages/ScenarioPage'
import SprintFormPage from './pages/SprintFormPage'
import ComparePage from './pages/ComparePage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'scenario/:id', element: <ScenarioPage /> },
      { path: 'scenario/:id/sprint/:sprintNumber', element: <SprintFormPage /> },
      { path: 'compare', element: <ComparePage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
