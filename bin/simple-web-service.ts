#!/usr/bin/env node
  
// All component from @aws-cdk module like any other node pkg
import apigateway = require('@aws-cdk/aws-apigateway'); 
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require ('@aws-cdk/aws-lambda')
import cdk = require('@aws-cdk/core');

// creating custom stack by extending the cdk.Stack 
export class SimpleWebServiceStack extends cdk.Stack {
  
    constructor(app: cdk.App, id: string) {
    super(app, id);

    // Create a customer table in DynamoDB
    const dynamoTable = new dynamodb.Table(this, 'customers', {
      partitionKey: {
        name: 'custId',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'customers',

      // The default removal policy is RETAIN
      // But NOT recommended for production code
      removalPolicy: cdk.RemovalPolicy.DESTROY 
    });


    // this is where Infra Code meets Application Code 
    // Get Single customer info - Lamnda Integration 
    const getSingle_cust_info_Lambda = new lambda.Function(this, 'getSingleCustInfo', {
      code: new lambda.AssetCode('lambda'),
      handler: 'get_one_cust_info.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'custId'
      }
    });

    // Get all customer info - Lamnda Integration
    // See how ENV variable are used to pass db table and primary key
    const getAll_cust_info_Lambda = new lambda.Function(this, 'getAllCustInfo', {
      code: new lambda.AssetCode('lambda'),
      handler: 'get_all_cust_info.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'custId'
      }
    });

    // Create save  customer info - Lamnda Integration
    const create_cust_info = new lambda.Function(this, 'createCustInfo', {
      code: new lambda.AssetCode('lambda'),
      handler: 'save_cust_info.handler',
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'custId'
      }
    });

    
    // Provide "Permisions" to Lamda Functions to execute on "dynamo" table
    dynamoTable.grantReadWriteData(getSingle_cust_info_Lambda);
    dynamoTable.grantReadWriteData(getAll_cust_info_Lambda);
    dynamoTable.grantReadWriteData(create_cust_info);

    // Now create an API gateway 
    const api = new apigateway.RestApi(this, 'customerApi', {
      restApiName: 'Customer Service'
    });


    // Create and add resource customers and do the 
    // Plumbing between LAMBDA function and API Gateway 
    const customers = api.root.addResource('customers');
    const getAllIntegration = new apigateway.LambdaIntegration(getAll_cust_info_Lambda);
    customers.addMethod('GET', getAllIntegration);

    const createOneIntegration = new apigateway.LambdaIntegration(create_cust_info);
    customers.addMethod('POST', createOneIntegration);
    addCorsOptions(customers);

    const singleItem = customers.addResource('{id}');
    const getSingleCustInfo = new apigateway.LambdaIntegration(getSingle_cust_info_Lambda);
    singleItem.addMethod('GET', getSingleCustInfo);

  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },  
    }]
  })
}

const app = new cdk.App();
new SimpleWebServiceStack(app, 'CustomerRESTServerlessService');
app.synth();
