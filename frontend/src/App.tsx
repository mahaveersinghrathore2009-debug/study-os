import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Study from "./pages/Study";
import Focus from "./pages/Focus";
import Subjects from "./pages/Subjects";
import CalendarPage from "./pages/Calendar";
import Goals from "./pages/Goals";
import Notes from "./pages/Notes";
import Flashcards from "./pages/Flashcards";
import AIAssistant from "./pages/AIAssistant";
import Analytics from "./pages/Analytics";
import Mood from "./pages/Mood";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<Study />} />
        <Route path="focus" element={<Focus />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="goals" element={<Goals />} />
        <Route path="notes" element={<Notes />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="mood" element={<Mood />} />
        <Route path="journal" element={<Journal />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
