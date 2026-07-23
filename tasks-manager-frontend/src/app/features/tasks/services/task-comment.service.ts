import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../core/models/page-response.model';
import { TaskCommentResponse, SaveTaskCommentRequest } from '../models/task-comment.models';

/*
 * Handles Task-comment HTTP communication only.
 *
 * UI state, permissions, dialogs, and alerts remain
 * inside their appropriate feature components.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskCommentService {

  private readonly http =
    inject(HttpClient);

  private readonly tasksUrl =
    `${environment.apiUrl}/tasks`;

  getComments(
    taskId: number,
    page: number,
    size: number
  ): Observable<
    PageResponse<TaskCommentResponse>
  > {
    const params =
      new HttpParams()
        .set('page', String(page))
        .set('size', String(size))
        .append(
          'sort',
          'createdAt,asc'
        );

    return this.http.get<
      PageResponse<TaskCommentResponse>
    >(
      `${this.tasksUrl}/${taskId}/comments`,
      {
        params
      }
    );
  }

  createComment(
    taskId: number,
    request: SaveTaskCommentRequest
  ): Observable<TaskCommentResponse> {
    return this.http.post<
      TaskCommentResponse
    >(
      `${this.tasksUrl}/${taskId}/comments`,
      request
    );
  }

  updateComment(
    taskId: number,
    commentId: number,
    request: SaveTaskCommentRequest
  ): Observable<TaskCommentResponse> {
    return this.http.put<
      TaskCommentResponse
    >(
      `${this.tasksUrl}/${taskId}/comments/${commentId}`,
      request
    );
  }

  deleteComment(
    taskId: number,
    commentId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.tasksUrl}/${taskId}/comments/${commentId}`
    );
  }
}