import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO-DONE: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-9yt1kpv9.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing user', event.authorizationToken)

  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message, fullError: e })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function getCertificate(): Promise<string> {
  // if (cachedCert) return cachedCert
  try {
    const getJwksResponse = await Axios.get(jwksUrl)
    logger.info('retrieved cert keys from Auth0', {unparsedCert: getJwksResponse.data['keys'][0]['x5c'][0]})
    const unparsedCert = getJwksResponse.data['keys'][0]['x5c'][0];
    return certToPEM(unparsedCert)
  } catch (error) {
    logger.error('Failed to parse certificate', error)
  }
}

function certToPEM(unparsedCert: string) {
  return `-----BEGIN CERTIFICATE-----\n${unparsedCert}\n-----END CERTIFICATE-----\n`;
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const cert = await getCertificate()
  logger.info('attempting to verify cert from token:'+ token)
  return verify(token, cert, {
    algorithms: ["RS256"]
  }) as JwtPayload

  // TODO-DONE: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  // return undefined
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
