import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ScenarioPage from './pages/ScenarioPage'
import SprintFormPage from './pages/SprintFormPage'
import ComparePage from './pages/ComparePage'
import PromptsPage from './pages/PromptsPage'
import PromptDetailPage from './pages/PromptDetailPage'
import { recomputeAllSprintPromptCounters } from './db/hooks/usePrompts'
import { TimerProvider } from './context/TimerContext'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'scenario/:id', element: <ScenarioPage /> },
      { path: 'scenario/:id/sprint/:sprintNumber', element: <SprintFormPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'prompts', element: <PromptsPage /> },
      { path: 'prompts/:promptId', element: <PromptDetailPage /> },
    ],
  },
])

export default function App() {
  useEffect(() => {
    void recomputeAllSprintPromptCounters()
  }, [])

  return (
    <TimerProvider>
      <RouterProvider router={router} />
    </TimerProvider>
  )
}
