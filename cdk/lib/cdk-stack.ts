import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import { CorsHttpMethod, HttpApi, HttpConnectionType, HttpIntegrationType, HttpMethod, DomainName, CfnIntegration, VpcLink, PayloadFormatVersion, CfnRoute, CfnAuthorizer } from '@aws-cdk/aws-apigatewayv2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // VPC to run the ECS cluster in
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      tags: {
        'environment': 'non-production',
        'purpose': 'vpc'
      }
    });

   // Temp cluster to host our app
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
      clusterName: 'jaws-pankration-2021'
    });

    // The task that will contain our app
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 2048, // Default is 512
    });

    // Create the definition for our app - it will build a docker image and host it.
    taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromAsset('../app/'),
      containerName: "PankrationApp",
      essential: true,
      memoryLimitMiB: 1024, // Default is 512
      portMappings: [{
        containerPort: 8080
      }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'jaws-pankration' })
    });

    // Create a load-balanced Fargate service and make it public
    const ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 1, // Default is 1
      taskDefinition: taskDefinition,
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true,// Default is false
      assignPublicIp: true,
      circuitBreaker: {rollback: true}
    });

    // Make sure the app is up and running
    ecsService.targetGroup.configureHealthCheck({
      'port': 'traffic-port',
      'path': '/punchlist/actuator/health',
      'healthyThresholdCount': 2,
      'unhealthyThresholdCount': 5,
      'healthyHttpCodes': '200,301,302'
    })

    //autoscaling 
    ecsService.service.autoScaleTaskCount({
      maxCapacity: 2,
      minCapacity: 1
    });

    const httpApi = new HttpApi(this, 'httpAPI', {
      apiName: 'JAWS-Pankration-API',
      description: 'Example Service',
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'userId',
          'auth0Id'
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
      },
    });

    const role = new iam.Role(this, 'apiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // Auth Lambda - build from the code base
    const lambdaAuthorizer = new lambda.Function(this, 'authorizerFunction', {
          code: new lambda.AssetCode('lambda/authenticateUser'),
          handler: 'auth.handler',
          runtime: lambda.Runtime.NODEJS_14_X,
          logRetention: logs.RetentionDays.THREE_DAYS,
          environment: {
            'API_URL': ecsService.loadBalancer.loadBalancerDnsName,
            'AUTH0_DOMAIN': 'https://jaws-pankration-2021.us.auth0.com'
          }
        });
    
    role.addToPolicy(new iam.PolicyStatement({
      resources: [lambdaAuthorizer.functionArn],
      actions: ['lambda:InvokeFunction'],
    }));

    const authorizer = new CfnAuthorizer(this, 'auth0Authorizer', {
      apiId: httpApi.httpApiId,
      authorizerType: 'REQUEST',
      identitySource: ['$request.header.Authorization'],
      name: 'pankration-authorizer',
      authorizerUri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/' + lambdaAuthorizer.functionArn + '/invocations',
      authorizerPayloadFormatVersion: '1.0',
      authorizerCredentialsArn: role.roleArn
    });

    const vpcLink = new VpcLink(this, 'vpcLink', {
      vpc: vpc,
      vpcLinkName: 'jawsVpcLink'
    });

    const authIntegration = new CfnIntegration(this, 'authIntegration', {
      apiId: httpApi.apiId,
      integrationType: HttpIntegrationType.HTTP_PROXY,
      integrationUri: ecsService.listener.listenerArn,
      integrationMethod: HttpMethod.ANY,
      connectionId: vpcLink.vpcLinkId,
      connectionType: HttpConnectionType.VPC_LINK,
      payloadFormatVersion: PayloadFormatVersion.VERSION_1_0.version,
      requestParameters: {
        'overwrite:header.auth0Id': '$context.authorizer.auth0Id',
        'overwrite:header.userId': '$context.authorizer.userId'
      },
    });

    new CfnRoute(this, 'noAuthRouteOptions', {
      apiId: httpApi.apiId,
      routeKey: 'OPTIONS /{proxy+}',
      target: 'integrations/' + authIntegration.ref
    });

    new CfnRoute(this, 'authRouteGET', {
      apiId: httpApi.apiId,
      routeKey: 'GET /{proxy+}',
      target: 'integrations/' + authIntegration.ref,
      authorizationType: 'CUSTOM',
      authorizerId: authorizer.ref,
    });
  }
}
