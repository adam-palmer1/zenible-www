// API service for the CRM Tasks (per-user private task tree) feature.

import { createCRUDService } from '../createCRUDService';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface UserNotebook {
  id: string;
  user_id: string;
  project_id: string | null;
  project_name: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface UserNotebookCreate {
  name: string;
  project_id?: string | null;
}

export interface UserNotebookUpdate {
  name?: string;
  project_id?: string | null;
}

export interface UserNotebookListResponse {
  items: UserNotebook[];
  total: number;
}

export interface UserTaskFolder {
  id: string;
  user_id: string;
  notebook_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface UserTaskFolderCreate {
  name: string;
  notebook_id: string;
  parent_id?: string | null;
}

export interface UserTaskFolderUpdate {
  name?: string;
}

export interface UserTaskFolderListResponse {
  items: UserTaskFolder[];
  total: number;
}

export interface UserTask {
  id: string;
  user_id: string;
  notebook_id: string;
  folder_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface UserTaskCreate {
  title: string;
  description?: string | null;
  notebook_id: string;
  folder_id?: string | null;
  contact_id?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
}

export interface UserTaskUpdate {
  title?: string;
  description?: string | null;
  contact_id?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
}

export interface UserTaskListResponse {
  items: UserTask[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserTaskTreeNode extends UserTaskFolder {
  folders: UserTaskTreeNode[];
  tasks: UserTask[];
}

export interface UserTaskTreeResponse {
  folders: UserTaskTreeNode[];
  tasks: UserTask[];
}

export interface FolderMoveRequest {
  new_parent_id: string | null;
  /** Omit to append at the end of the target sibling list. */
  new_sort_order?: number;
  new_notebook_id?: string | null;
}

export interface TaskMoveRequest {
  new_folder_id: string | null;
  /** Omit to append at the end of the target sibling list. */
  new_sort_order?: number;
  new_notebook_id?: string | null;
}

// -----------------------------------------------------------------------------
// Notebooks API
// -----------------------------------------------------------------------------

const notebooksBase = createCRUDService<
  UserNotebook,
  UserNotebookListResponse,
  UserNotebookCreate,
  UserNotebookUpdate
>('/crm/tasks/notebooks', 'UserNotebooksAPI');

export const notebooksAPI = notebooksBase;

// -----------------------------------------------------------------------------
// Folders API
// -----------------------------------------------------------------------------

const foldersBase = createCRUDService<
  UserTaskFolder,
  UserTaskFolderListResponse,
  UserTaskFolderCreate,
  UserTaskFolderUpdate
>('/crm/tasks/folders', 'UserTaskFoldersAPI');

export const taskFoldersAPI = {
  ...foldersBase,
  async move(id: string, body: FolderMoveRequest): Promise<UserTaskFolder> {
    return foldersBase.request<UserTaskFolder>(`/crm/tasks/folders/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

// -----------------------------------------------------------------------------
// Tasks API
// -----------------------------------------------------------------------------

const tasksBase = createCRUDService<
  UserTask,
  UserTaskListResponse,
  UserTaskCreate,
  UserTaskUpdate
>('/crm/tasks/tasks', 'UserTasksAPI');

export const userTasksAPI = {
  ...tasksBase,
  async move(id: string, body: TaskMoveRequest): Promise<UserTask> {
    return tasksBase.request<UserTask>(`/crm/tasks/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  async getTree(notebookId?: string): Promise<UserTaskTreeResponse> {
    const qs = notebookId ? `?notebook_id=${encodeURIComponent(notebookId)}` : '';
    return tasksBase.request<UserTaskTreeResponse>(`/crm/tasks/tree${qs}`, { method: 'GET' });
  },
};

export default userTasksAPI;
