// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'k0genreac7'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO-DONE: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-9yt1kpv9.us.auth0.com',            // Auth0 domain
  clientId: 'FDM2vYvEuSmWVgyCE5baQxoI5oFtvmo1',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
