import { v4 as generateUniqueId } from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/TodoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {

  return await todoAccess.getAllTodos(userId)
}

export async function createTodoItem(
  userId: string,
  todo: CreateTodoRequest,
): Promise<TodoItem> {

  return await todoAccess.createTodoItem({
    userId,
    todoId: generateUniqueId(),
    done: false,
    createdAt: new Date().toISOString(),
    ...todo
  })
}

export async function generateUploadUrl(userId: string, todoId: string): Promise<string> {
  const uploadUrl = await todoAccess.getSignedUrl(todoId)
  await todoAccess.updateAttachmentUrl(userId, todoId)

  return uploadUrl
}

export async function updateTodoItem(
  userId: string,
  todoId: string,
  todo: UpdateTodoRequest,
): Promise<void> {

  await todoAccess.updateTodoItem(todo, userId, todoId)
}

export async function deleteTodoItem(userId: string, todoId: string) {

  await Promise.all([
    todoAccess.deleteTodoItem(userId, todoId),
    todoAccess.deleteTodoItemAttachment(todoId)
  ])
}