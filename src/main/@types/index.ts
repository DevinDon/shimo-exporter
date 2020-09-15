export interface Permissions {
  readable: boolean;
  editable: boolean;
  commentable: boolean;
  manageable: boolean;
  exitable: boolean;
  exportable: boolean;
  collaboratorManageable: boolean;
  adminManageable: boolean;
  outsiderAddable: boolean;
  childFileCreatable: boolean;
  shareModeManageable: boolean;
  teamShareModeManageable: boolean;
  copyable: boolean;
  lockable: boolean;
  unlockable: boolean;
  removable: boolean;
  downloadable: boolean;
  moveable: boolean;
  sheetLockable: boolean;
  passwordShareable: boolean;
  fileAuthSetable: boolean;
}

export interface User {
  id: number;
  name: string;
  avatar: string;
  email: string;
}

export interface UpdatedUser {
  id: number;
  name: string;
  avatar: string;
  email: string;
}

export interface LockedUser {
}

export interface Permission {
  id?: any;
  role: string;
  owner: boolean;
}

export interface ShimoFile {
  is_folder: number;
  role: string;
  permissions: Permissions;
  url: string;
  isDelete: number;
  namePinyin: string;
  parentId: any;
  passwordProtected: boolean;
  shareCount: number;
  shareMode: string;
  teamId: number;
  userId: number;
  deletedBy?: any;
  updatedAt: Date;
  updatedBy: number;
  createdAt: Date;
  id: any;
  guid: string;
  name: string;
  name_pinyin: string;
  password_protected: boolean;
  password: string;
  share_mode: string;
  type: string;
  is_delete: number;
  user_id: number;
  deleted_by?: any;
  updated_by: number;
  team_id: number;
  parent_id: any;
  created_at: Date;
  updated_at: Date;
  isFromSVC: boolean;
  isFolder: boolean;
  collaboratorCount: number;
  departmentCollaboratorCount: number;
  isSpace: boolean;
  isLocked: boolean;
  parentRole: string;
  isShortcut: boolean;
  isLegacy: boolean;
  hasChildren: boolean;
  isFileAdmin: boolean;
  isCloudFile: boolean;
  thumbnailUrl: string;
  supportPDFPreview: boolean;
  downloadUrl: string;
  fileSize: number;
  subType: string;
  user: User;
  updatedUser: UpdatedUser;
  lockedUser: LockedUser;
  Permissions: Permission[];
  sortName: string[];
  starred: boolean;
  tags: any[];
  marked: boolean;
  share_count: number;
  inviteCode: string;
}
