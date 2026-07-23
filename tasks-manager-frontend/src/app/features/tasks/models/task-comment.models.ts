export type CommentAuthorRole =
  | 'ADMIN'
  | 'USER';

/*
 * Matches the actual CommentResponse returned
 * by the Spring Boot backend.
 */
export interface TaskCommentResponse {
  id: number;
  content: string;
  taskId: number;

  authorId: number;
  authorName: string;
  authorRole: CommentAuthorRole;

  createdAt: string;
  updatedAt: string;
}

export interface SaveTaskCommentRequest {
  content: string;
}