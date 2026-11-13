import { Route, Routes } from 'react-router-dom'
import { RootLayout } from './layout/RootLayout'
import { HomePage } from './pages/home/HomePage'
import { ModelsPage } from './pages/models/ModelsPage'
import { ProjectsPage } from './pages/projects/ProjectsPage'
import { ProjectDetailPage } from './pages/projects/detail/ProjectDetailPage'
import { StoryPage } from './pages/projects/story/StoryPage'
import { AboutPage } from './pages/about/AboutPage'
import { ContactPage } from './pages/contact/ContactPage'
import { ResumePage } from './pages/resume/ResumePage'

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:id/story" element={<StoryPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="resume" element={<ResumePage />} />
      </Route>
    </Routes>
  )
}

export default App
