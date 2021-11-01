/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const axios = require('axios');
const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18',
  region: 'ap-northeast-2',
});

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/user/login', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

app.get('/user/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/user/login', async function(req, res) {
  console.log('req.body:', JSON.stringify(req.body, null, 2));
  const { access_token } = req.body || {};
  const kakaoAuthUrl = 'https://kapi.kakao.com/v2/user/me';
  const kakaoAuthOptions = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };
  const axiosRes = await axios.get(kakaoAuthUrl, kakaoAuthOptions);
  console.log('axios res:', axiosRes);
  const { status, data } = axiosRes;
  if (status > 200) {
    res.json({
      success: 'post call failed!',
      url: req.url,
      body: req.body,
      axiosRes: axiosRes.data,
    });
    return;
  }
  const GroupName = 'Kakao';
  const UserPoolId = `{Cognito's User Pool id}`;  // aws-exports.js의 "aws_user_pools_id"
  const ClientId = `{Cognito's Web client id}`; // aws-exports.js "aws_user_pools_web_client_id"
  const Username = 'kakao_' + data.id
  const newUserParam = {
    ClientId,
    Username,
    Password: data.id.toString(),
    ClientMetadata: {
      UserPoolId,
      Username,
      GroupName,
    },
    UserAttributes: [
      {
        Name: 'email' /* required */,
        Value: data.kakao_account.email,
      },
      {
        Name: 'name' /* required */,
        Value: Username,
      },
    ],
  };
  const signUpRes = await cognitoidentityserviceprovider.signUp(newUserParam).promise();
  console.log('signUpRes', signUpRes)

  res.json({
    success: 'post call succeed!',
    url: req.url,
    body: req.body,
    signUpRes,
  });
});

app.post('/user/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* Example put method *
****************************/

app.put('/user/login', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/user/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/user/login', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/user/login/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
