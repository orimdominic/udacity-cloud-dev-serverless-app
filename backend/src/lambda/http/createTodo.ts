import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodoItem } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO-DONE: Implement creating a new TODO item
    const userId = getUserId(event)
    const newTodo: CreateTodoRequest = JSON.parse(event.body)

    const newItem = await createTodoItem(userId, newTodo)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newItem
      })
    }

  })
handler
.use(httpErrorHandler())
.use(
  cors({
    credentials: true
  })
)
