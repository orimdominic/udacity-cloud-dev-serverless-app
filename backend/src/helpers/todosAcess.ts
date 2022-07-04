import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


export class TodoAccess {

  constructor(
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
) {}

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('creating todo item', {todoItem})

    await this.docClient.put({
      TableName: this.todosTable,
      Item: {
        ...todoItem
      }
    }).promise()

    logger.info('created todo item', {todoItem})
    return todoItem
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('getting todo items for user', {userId})

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
    }).promise()

    return result.Items as TodoItem[]
  }

  async getSignedUrl(bucketKey: string): Promise<string> {
    logger.info('getting signed url')

    return this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: bucketKey,
      Expires: Number(this.urlExpiration)
    })
  }

  async updateAttachmentUrl(userId: string, todoId: string): Promise<void> {
    logger.info('updating attachmentUrl')

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      },
      UpdateExpression: "set attachmentUrl=:attachmentUrl",
      ExpressionAttributeValues: {
        ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
      }
    }).promise()
  }

  async updateTodoItem(updateTodoRequest: TodoUpdate, userId: string, todoId: string): Promise<void> {
    logger.info('updating todoItem for user', {userId, todoId})

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      },
      UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
      ExpressionAttributeValues: {
        ":name": updateTodoRequest.name,
        ":dueDate": updateTodoRequest.dueDate,
        ":done": updateTodoRequest.done
      },
      ExpressionAttributeNames: {
        "#name": "name"
      }
    }).promise()

    logger.info('updated todoItem for user', {userId, todoId})
  }

  async deleteTodoItem(userId: string, todoId: string): Promise<void> {
    logger.info('deleting todoItem for user', {userId, todoId})

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        "userId": userId,
        "todoId": todoId
      }
    }).promise()

    logger.info('deleted todoItem for user', {userId, todoId})
  }

  async deleteTodoItemAttachment(bucketKey: string): Promise<void> {
    logger.info('deleteTodoItemAttachment')

    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: bucketKey
    }).promise()
  }
}