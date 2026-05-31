import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Categories } from "./pages/Categories";
import { Dashboard } from "./pages/Dashboard";
import { EditEntry } from "./pages/EditEntry";
import { EntryDetail } from "./pages/EntryDetail";
import { NewEntry } from "./pages/NewEntry";
import { NotFound } from "./pages/NotFound";
import { PlanPage } from "./pages/PlanPage";
import { SearchPage } from "./pages/SearchPage";
import { TagsPage } from "./pages/Tags";
import { TimelinePage } from "./pages/TimelinePage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="entry/new" element={<NewEntry />} />
        <Route path="entry/:id" element={<EntryDetail />} />
        <Route path="entry/:id/edit" element={<EditEntry />} />
        <Route path="categories" element={<Categories />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
