import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import coursesAPI from '../../services/coursesAPI';
import adminAPI from '../../services/adminAPI';
import CourseFormModal from './modals/CourseFormModal';
import ModuleListModal from './modals/ModuleListModal';
import ResourceListModal from './modals/ResourceListModal';
import useCourseManagement from '../../hooks/useCourseManagement';
import useModuleManagement from '../../hooks/useModuleManagement';
import useResourceManagement from '../../hooks/useResourceManagement';

export default function CourseManagement() {
  const { darkMode } = useOutletContext();

  // Plans state (needed by course management hook)
  const [plans, setPlans] = useState([]);

  // Tab state
  const [activeTab, setActiveTab] = useState('courses'); // courses, analytics

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  // Course management hook
  const {
    courses,
    loading,
    error,
    page,
    perPage,
    totalPages,
    total,
    search,
    categoryFilter,
    difficultyFilter,
    planFilter,
    activeFilter,
    publishedFilter,
    availableCategories,
    showCourseModal,
    editingCourse,
    showDeleteModal,
    deletingCourse,
    showBulkModal,
    selectedCourses,
    bulkAction,
    courseForm,
    showEnrollmentsModal,
    selectedCourseForEnrollments,
    enrollments,
    enrollmentsLoading,
    setPage,
    setPerPage,
    setSearch,
    setCategoryFilter,
    setDifficultyFilter,
    setPlanFilter,
    setActiveFilter,
    setPublishedFilter,
    setShowCourseModal,
    setShowDeleteModal,
    setDeletingCourse,
    setShowBulkModal,
    setBulkAction,
    setCourseForm,
    setShowEnrollmentsModal,
    setSelectedCourseForEnrollments,
    setEnrollments,
    fetchCourses,
    fetchCourseEnrollments,
    handleCreateCourse,
    handleEditCourse,
    handleCloneCourse,
    handleSaveCourse,
    handleDeleteCourse,
    handleToggleActive,
    handleTogglePublished,
    handleBulkAction,
    handleViewEnrollments,
    toggleSelectCourse,
    toggleSelectAll
  } = useCourseManagement(plans);

  // Module management hook
  const {
    modules,
    modulesLoading,
    showModulesModal,
    selectedCourseForModules,
    showModuleModal,
    editingModule,
    showDeleteModuleModal,
    deletingModule,
    moduleForm,
    setModules,
    setShowModulesModal,
    setSelectedCourseForModules,
    setShowModuleModal,
    setModuleForm,
    setShowDeleteModuleModal,
    setDeletingModule,
    handleManageModules,
    handleCreateModule,
    handleEditModule,
    handleSaveModule,
    handleDeleteModule
  } = useModuleManagement();

  // Resource management hook
  const {
    resources,
    resourcesLoading,
    showResourcesModal,
    selectedCourseForResources,
    selectedModuleForResources,
    showResourceModal,
    editingResource,
    showDeleteResourceModal,
    deletingResource,
    resourceForm,
    resourceTypes,
    setResources,
    setShowResourcesModal,
    setSelectedCourseForResources,
    setSelectedModuleForResources,
    setShowResourceModal,
    setEditingResource,
    setShowDeleteResourceModal,
    setDeletingResource,
    setResourceForm,
    handleManageResources,
    handleCreateResource,
    handleEditResource,
    handleSaveResource,
    handleDeleteResource
  } = useResourceManagement();

  // Difficulty levels
  const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced'];

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch analytics when tab changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, analyticsDays]);

  const fetchPlans = async () => {
    try {
      const response = await adminAPI.getPlans({ is_active: true });
      setPlans(response.plans || response.items || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await coursesAPI.getCourseAnalytics({ days: analyticsDays });
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Course Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Manage courses, modules, and enrollments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Courses List
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-zenible-primary text-zenible-primary font-medium'
                : `border-transparent ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'} hover:text-zenible-primary`
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Courses List Tab */}
      {activeTab === 'courses' && (
        <>
          {/* Filters and Actions */}
          <div className="p-6">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search in title and description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => {
                    setDifficultyFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Difficulty Levels</option>
                  {difficultyLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Plans</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>

                <select
                  value={activeFilter}
                  onChange={(e) => {
                    setActiveFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Active Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>

                <select
                  value={publishedFilter}
                  onChange={(e) => {
                    setPublishedFilter(e.target.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">All Published Status</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateCourse}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Create Course
                </button>

                {selectedCourses.length > 0 && (
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Bulk Actions ({selectedCourses.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="px-6 pb-6">
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-12">Error: {error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            <input
                              type="checkbox"
                              checked={selectedCourses.length === courses.length && courses.length > 0}
                              onChange={toggleSelectAll}
                              className="rounded"
                            />
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Title
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Category
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Difficulty
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Enrollments
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Modules
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {courses.map(course => {
                          const difficultyColor = coursesAPI.getDifficultyColor(course.difficulty);
                          return (
                            <tr key={course.id}>
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course.id)}
                                  onChange={() => toggleSelectCourse(course.id)}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                      {course.title}
                                    </div>
                                    {course.is_featured && (
                                      <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 border border-yellow-300">
                                        ⭐ Featured
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                                    {truncateText(course.description, 60)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                  {course.category || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${difficultyColor.bg} ${difficultyColor.text} border ${difficultyColor.border}`}>
                                  {course.difficulty}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleViewEnrollments(course)}
                                  className="text-sm text-blue-600 hover:text-blue-900 underline"
                                >
                                  {course.enrollment_count || 0}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleManageModules(course)}
                                  className="text-sm text-blue-600 hover:text-blue-900 underline"
                                >
                                  {course.total_modules || 0} modules
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Active:</span>
                                    <button
                                      onClick={() => handleToggleActive(course)}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        course.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                          course.is_active ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Published:</span>
                                    <button
                                      onClick={() => handleTogglePublished(course)}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        course.status === 'published' ? 'bg-zenible-primary' : 'bg-gray-300'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                          course.status === 'published' ? 'translate-x-5' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditCourse(course)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCloneCourse(course)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Clone
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingCourse(course);
                                      setShowDeleteModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Page {page} of {totalPages} ({total} total)
                        </span>
                        <select
                          value={perPage}
                          onChange={(e) => {
                            setPerPage(parseInt(e.target.value));
                            setPage(1);
                          }}
                          className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                          <option value="100">100 per page</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className={`px-3 py-1 text-sm rounded ${
                            page === 1
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className={`px-3 py-1 text-sm rounded ${
                            page === totalPages
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-zenible-primary text-white hover:bg-opacity-90'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <select
              value={analyticsDays}
              onChange={(e) => setAnalyticsDays(parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 365 days</option>
            </select>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Courses</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_courses || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Published Courses</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.published_courses || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Enrollments</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.total_enrollments || 0}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Enrollments</div>
                  <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {analytics.active_enrollments || 0}
                  </div>
                </div>
              </div>

              {analytics.analytics && analytics.analytics.length > 0 && (
                <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  <div className="p-4 border-b">
                    <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                      Course Performance
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Course
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Enrollments
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Completed
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Avg Progress
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            Completion Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                        {analytics.analytics.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.total_enrollments || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.completed_enrollments || 0}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.average_progress?.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                                {item.completion_rate?.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No analytics data available
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Course Modal */}
      <CourseFormModal
        show={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        editingCourse={editingCourse}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        handleSaveCourse={handleSaveCourse}
        plans={plans}
        availableCategories={availableCategories}
        difficultyLevels={difficultyLevels}
        darkMode={darkMode}
      />

      {/* Delete Course Modal */}
      {showDeleteModal && deletingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Confirm Delete
              </h3>
            </div>
            <div className="p-6">
              <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Are you sure you want to delete this course? This will also delete all associated modules.
              </p>
              <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                "{deletingCourse.title}"
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCourse(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Bulk Actions
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Action
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                >
                  <option value="">Select action...</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="publish">Publish</option>
                  <option value="unpublish">Unpublish</option>
                  <option value="delete">Delete</option>
                </select>
              </div>

              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                {selectedCourses.length} course(s) selected
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className={`px-4 py-2 rounded-lg ${
                  bulkAction
                    ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Execute
              </button>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkAction('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {showEnrollmentsModal && selectedCourseForEnrollments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Course Enrollments: {selectedCourseForEnrollments.title}
              </h3>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : enrollments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          User
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Progress
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Status
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          Enrolled At
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                      {enrollments.map((enrollment) => {
                        const statusColor = coursesAPI.getStatusColor(enrollment.status);
                        return (
                          <tr key={enrollment.id}>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {enrollment.user_email}
                            </td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {enrollment.progress_percentage || 0}%
                            </td>
                            <td className={`px-4 py-3 text-sm`}>
                              <span className={`px-2 py-1 text-xs rounded-full ${statusColor.bg} ${statusColor.text}`}>
                                {enrollment.status}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                              {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  No enrollments yet
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={() => {
                  setShowEnrollmentsModal(false);
                  setSelectedCourseForEnrollments(null);
                  setEnrollments([]);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Modals */}
      <ModuleListModal
        show={showModulesModal}
        onClose={() => {
          setShowModulesModal(false);
          setSelectedCourseForModules(null);
          setModules([]);
        }}
        selectedCourse={selectedCourseForModules}
        modules={modules}
        modulesLoading={modulesLoading}
        onCreateModule={handleCreateModule}
        onEditModule={handleEditModule}
        onDeleteModule={handleDeleteModule}
        onManageResources={handleManageResources}
        showModuleModal={showModuleModal}
        setShowModuleModal={setShowModuleModal}
        editingModule={editingModule}
        moduleForm={moduleForm}
        setModuleForm={setModuleForm}
        onSaveModule={handleSaveModule}
        showDeleteModuleModal={showDeleteModuleModal}
        setShowDeleteModuleModal={setShowDeleteModuleModal}
        deletingModule={deletingModule}
        setDeletingModule={setDeletingModule}
        darkMode={darkMode}
      />

      {/* Resource Modals */}
      <ResourceListModal
        show={showResourcesModal}
        onClose={() => {
          setShowResourcesModal(false);
          setSelectedCourseForResources(null);
          setSelectedModuleForResources(null);
          setResources([]);
        }}
        selectedCourse={selectedCourseForResources}
        selectedModule={selectedModuleForResources}
        resources={resources}
        resourcesLoading={resourcesLoading}
        onCreateResource={handleCreateResource}
        onEditResource={handleEditResource}
        onDeleteResource={handleDeleteResource}
        showResourceModal={showResourceModal}
        setShowResourceModal={setShowResourceModal}
        editingResource={editingResource}
        resourceForm={resourceForm}
        setResourceForm={setResourceForm}
        onSaveResource={handleSaveResource}
        showDeleteResourceModal={showDeleteResourceModal}
        setShowDeleteResourceModal={setShowDeleteResourceModal}
        deletingResource={deletingResource}
        setDeletingResource={setDeletingResource}
        resourceTypes={resourceTypes}
        darkMode={darkMode}
      />
    </div>
  );
}
