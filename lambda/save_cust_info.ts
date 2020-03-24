
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');

export const handler = async (event: any = {}) : Promise <any> => {

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'invalid request!'
    }
  }

  const TABLE_NAME = process.env.TABLE_NAME || '';
  const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
  
  const customer = typeof event.body == 'object' ? 
                  event.body : JSON.parse(event.body);

  customer[PRIMARY_KEY] = uuidv4();
  const params = {
    TableName: TABLE_NAME,
    Customer: customer
  };

  try {
    await db.put(params).promise();
    return { 
      statusCode: 201, 
      body: '' 
    };
  } catch (dbError) {
    return { 
      statusCode: 500, 
      body: "ERROR" 
    };
  }
};