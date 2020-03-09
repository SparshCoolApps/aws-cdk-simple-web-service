import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import SimpleWebService = require('../lib/simple-web-service-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SimpleWebService.SimpleWebServiceStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
