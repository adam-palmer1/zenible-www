import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminAPI } from '../../services/adminAPI';
import AIToolModal from './AIToolModal';
import CharacterToolAssignment from './CharacterToolAssignment';

interface AdminOutletContext {
  darkMode: boolean;
}

export default function AIToolsManager() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [activeSubTab, setActiveSubTab] = useState<string>('tools');
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('all'); // 'all', 'active', 'inactive'
  const [showToolModal, setShowToolModal] = useState<boolean>(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const TOOLS_PER_PAGE = 10;

  useEffect(() => {
    if (activeSubTab === 'tools') {
      loadTools();
    }
  }, [activeSubTab, currentPage, filterActive]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filterActive !== 'all') {
        params.active_only = filterActive === 'active';
      }

      const response = await adminAPI.getAITools(params) as any;
      setTools(Array.isArray(response) ? response : []);

      // Calculate pagination (since backend might not provide it)
      const totalTools = response.length;
      setTotalPages(Math.max(1, Math.ceil(totalTools / TOOLS_PER_PAGE)));
    } catch (err) {
      console.error('Error loading AI tools:', err);
      setError((err as any).message || 'Failed to load AI tools');
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTool = () => {
    setEditingTool(null);
    setShowToolModal(true);
  };

  const handleEditTool = (tool: any) => {
    setEditingTool(tool);
    setShowToolModal(true);
  };

  const handleCloneTool = (tool: any) => {
    // Create a clone of the tool with a new name and reset some fields
    const clonedTool = {
      ...tool,
      name: `${tool.name} (Copy)`,
      id: null, // Remove ID so it creates a new tool
      created_at: null,
      updated_at: null
    };
    setEditingTool(clonedTool);
    setShowToolModal(true);
  };

  const handleDeleteTool = async (tool: any) => {
    if (!confirm(`Are you sure you want to delete the tool "${tool.name}"? This action cannot be undone and will remove it from all characters.`)) {
      return;
    }

    try {
      await adminAPI.deleteAITool(tool.id);
      await loadTools(); // Reload the list
    } catch (err) {
      console.error('Error deleting tool:', err);
      setError((err as any).message || 'Failed to delete tool');
    }
  };

  const handleToggleToolStatus = async (tool: any) => {
    try {
      await adminAPI.updateAITool(tool.id, {
        is_active: !tool.is_active
      });
      await loadTools(); // Reload the list
    } catch (err) {
      console.error('Error updating tool status:', err);
      setError((err as any).message || 'Failed to update tool status');
    }
  };

  const handleToolSaved = async () => {
    setShowToolModal(false);
    setEditingTool(null);
    await loadTools();
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = !searchTerm ||
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Apply pagination to filtered tools
  const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;
  const paginatedTools = filteredTools.slice(startIndex, startIndex + TOOLS_PER_PAGE);

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`h-16 border-b flex items-center justify-between px-6 ${
        darkMode
          ? 'bg-zenible-dark-card border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}>
        <h1 className={`text-2xl font-semibold ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-900'
        }`}>
          AI Tools Management
        </h1>

        <div className="flex items-center gap-3">
          {/* Sub-tab Navigation */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveSubTab('tools')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeSubTab === 'tools'
                  ? darkMode
                    ? 'bg-zenible-primary text-white'
                    : 'bg-zenible-primary text-white'
                  : darkMode
                  ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-bg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Manage Tools
            </button>
            <button
              onClick={() => setActiveSubTab('assignments')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                activeSubTab === 'assignments'
                  ? darkMode
                    ? 'bg-zenible-primary text-white border-zenible-primary'
                    : 'bg-zenible-primary text-white border-zenible-primary'
                  : darkMode
                  ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Character Assignments
            </button>
          </div>

          {activeSubTab === 'tools' && (
            <button
              onClick={handleCreateTool}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg text-sm font-medium hover:bg-zenible-primary-dark transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Tool
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${
          darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {/* Filters */}
      {activeSubTab === 'tools' && (
        <div className={`p-4 border-b ${
          darkMode
            ? 'bg-zenible-dark-bg border-zenible-dark-border'
            : 'bg-gray-50 border-neutral-200'
        }`}>
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tools by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                  : 'bg-white border-neutral-300 text-gray-900 placeholder-gray-500'
              }`}
            />

            {/* Status Filter */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-neutral-300 text-gray-900'
              }`}
            >
              <option value="all">All Tools</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Tools Management Tab */}
      {activeSubTab === 'tools' && (
        <div className="flex-1 overflow-auto p-6">

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : (
            <div className={`rounded-lg overflow-hidden ${
              darkMode ? 'bg-zenible-dark-card' : 'bg-white'
            }`}>
              <table className="w-full">
                <thead className={`${
                  darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'
                } border-b ${
                  darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Tool
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Description
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Created
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'
                }`}>
                  {paginatedTools.map((tool) => (
                    <tr key={tool.id} className={`${
                      darkMode ? 'hover:bg-zenible-dark-bg/50' : 'hover:bg-gray-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap w-64">
                        <div>
                          <div className={`font-medium truncate ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                          }`}>
                            {tool.name}
                          </div>
                          {tool.function_name && (
                            <div className={`text-xs truncate ${
                              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                            }`}>
                              {tool.function_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm w-80 truncate ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                        }`} title={tool.description}>
                          {tool.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleToolStatus(tool)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            tool.is_active
                              ? darkMode
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : darkMode
                              ? 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          }`}
                        >
                          {tool.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                        }`}>
                          {new Date(tool.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditTool(tool)}
                            className={`text-sm ${
                              darkMode
                                ? 'text-zenible-primary hover:text-zenible-primary-dark'
                                : 'text-zenible-primary hover:text-zenible-primary-dark'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCloneTool(tool)}
                            className={`text-sm ${
                              darkMode
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            Clone
                          </button>
                          <button
                            onClick={() => handleDeleteTool(tool)}
                            className={`text-sm ${
                              darkMode
                                ? 'text-red-400 hover:text-red-300'
                                : 'text-red-600 hover:text-red-800'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginatedTools.length === 0 && (
                <div className={`text-center py-8 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}>
                  {searchTerm || filterActive !== 'all'
                    ? 'No tools match your search criteria.'
                    : 'No AI tools found. Create your first tool to get started.'}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? darkMode
                      ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode
                    ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-tab-bg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? darkMode
                      ? 'bg-zenible-dark-bg text-zenible-dark-text-secondary cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode
                    ? 'bg-zenible-dark-card text-zenible-dark-text hover:bg-zenible-dark-tab-bg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Character Assignments Tab */}
      {activeSubTab === 'assignments' && (
        <div className="flex-1 overflow-auto p-6">
          <CharacterToolAssignment onError={setError} darkMode={darkMode} />
        </div>
      )}

      {/* Tool Modal */}
      {showToolModal && (
        <AIToolModal
          tool={editingTool}
          onClose={() => {
            setShowToolModal(false);
            setEditingTool(null);
          }}
          onSave={handleToolSaved}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}