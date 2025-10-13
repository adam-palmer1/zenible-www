import { useState, useEffect } from 'react';
import coursesAPI from '../services/coursesAPI';

/**
 * Custom hook for managing course-related state and operations
 * Handles courses list, pagination, filters, CRUD operations, and enrollments
 */
export const useCourseManagement = (plans) => {
  // Main state
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');

  // Available categories extracted from courses
  const [availableCategories, setAvailableCategories] = useState([]);

  // Modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedCourseForEnrollments, setSelectedCourseForEnrollments] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Bulk selection
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Beginner',
    estimated_duration_hours: '',
    thumbnail_url: '',
    intro_video_url: '',
    required_plan_ids: [],
    is_active: true,
    is_published: false,
    is_featured: false,
    meta_title: '',
    meta_description: ''
  });

  // Fetch courses when filters change
  useEffect(() => {
    fetchCourses();
  }, [page, perPage, search, categoryFilter, difficultyFilter, planFilter, activeFilter, publishedFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
        ...(planFilter && { required_plan_id: planFilter }),
        ...(activeFilter !== '' && { is_active: activeFilter === 'true' }),
        ...(publishedFilter !== '' && { is_published: publishedFilter === 'true' })
      };

      const response = await coursesAPI.getAdminCourses(params);
      setCourses(response.courses || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);

      // Extract unique categories from courses
      const categories = coursesAPI.extractUniqueCategories(response.courses || []);
      setAvailableCategories(categories);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseEnrollments = async (courseId) => {
    setEnrollmentsLoading(true);
    try {
      const response = await coursesAPI.getCourseEnrollments(courseId, { page: 1, per_page: 100 });
      setEnrollments(response.enrollments || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      alert(`Error fetching enrollments: ${err.message}`);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      category: '',
      difficulty: 'Beginner',
      estimated_duration_hours: '',
      thumbnail_url: '',
      intro_video_url: '',
      required_plan_ids: [],
      is_active: true,
      is_published: false,
      is_featured: false,
      meta_title: '',
      meta_description: ''
    });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category || '',
      difficulty: course.difficulty || 'Beginner',
      estimated_duration_hours: course.estimated_duration_hours || '',
      thumbnail_url: course.thumbnail_url || '',
      intro_video_url: course.intro_video_url || '',
      required_plan_ids: course.required_plan_ids || [],
      is_active: course.is_active,
      is_published: course.status === 'published',
      is_featured: course.is_featured || false,
      meta_title: course.meta_title || '',
      meta_description: course.meta_description || ''
    });
    setShowCourseModal(true);
  };

  const handleCloneCourse = (course) => {
    setEditingCourse(null);
    setCourseForm({
      title: `${course.title} (Copy)`,
      description: course.description,
      category: course.category || '',
      difficulty: course.difficulty || 'Beginner',
      estimated_duration_hours: course.estimated_duration_hours || '',
      thumbnail_url: course.thumbnail_url || '',
      intro_video_url: course.intro_video_url || '',
      required_plan_ids: course.required_plan_ids || [],
      is_active: course.is_active,
      is_published: false,
      is_featured: false,
      meta_title: course.meta_title || '',
      meta_description: course.meta_description || ''
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    try {
      const data = {
        title: courseForm.title,
        description: courseForm.description,
        category: courseForm.category,
        difficulty: courseForm.difficulty,
        is_active: courseForm.is_active,
        status: courseForm.is_published ? 'published' : 'draft',
        is_featured: courseForm.is_featured
      };

      // Add optional fields only if they have values
      if (courseForm.estimated_duration_hours) {
        data.estimated_duration_hours = parseFloat(courseForm.estimated_duration_hours);
      }

      if (courseForm.thumbnail_url) {
        data.thumbnail_url = courseForm.thumbnail_url;
      }

      if (courseForm.intro_video_url) {
        data.intro_video_url = courseForm.intro_video_url;
      }

      if (courseForm.required_plan_ids.length > 0) {
        data.required_plan_ids = courseForm.required_plan_ids;
      }

      if (courseForm.meta_title) {
        data.meta_title = courseForm.meta_title;
      }

      if (courseForm.meta_description) {
        data.meta_description = courseForm.meta_description;
      }

      if (editingCourse) {
        await coursesAPI.updateCourse(editingCourse.id, data);
      } else {
        await coursesAPI.createCourse(data);
      }

      setShowCourseModal(false);
      fetchCourses();
    } catch (err) {
      console.error('Error saving course:', err);
      alert(`Error saving course: ${err.message}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;

    try {
      await coursesAPI.deleteCourse(deletingCourse.id);
      setShowDeleteModal(false);
      setDeletingCourse(null);
      fetchCourses();
    } catch (err) {
      alert(`Error deleting course: ${err.message}`);
    }
  };

  const handleToggleActive = async (course) => {
    try {
      await coursesAPI.updateCourse(course.id, { is_active: !course.is_active });
      fetchCourses();
    } catch (err) {
      alert(`Error updating course: ${err.message}`);
    }
  };

  const handleTogglePublished = async (course) => {
    try {
      const newStatus = course.status === 'published' ? 'draft' : 'published';
      await coursesAPI.updateCourse(course.id, { status: newStatus });
      fetchCourses();
    } catch (err) {
      alert(`Error updating course: ${err.message}`);
    }
  };

  const handleBulkAction = async () => {
    if (selectedCourses.length === 0 || !bulkAction) return;

    try {
      await coursesAPI.bulkActionCourses({
        course_ids: selectedCourses,
        action: bulkAction
      });
      setShowBulkModal(false);
      setSelectedCourses([]);
      setBulkAction('');
      fetchCourses();
    } catch (err) {
      alert(`Error performing bulk action: ${err.message}`);
    }
  };

  const handleViewEnrollments = (course) => {
    setSelectedCourseForEnrollments(course);
    setShowEnrollmentsModal(true);
    fetchCourseEnrollments(course.id);
  };

  const toggleSelectCourse = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map(c => c.id));
    }
  };

  return {
    // State
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

    // Setters
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

    // Functions
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
  };
};

export default useCourseManagement;
