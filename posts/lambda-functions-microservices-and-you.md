Lambda Functions, Microservices and You
=======================================

Ye olde Express
---------------

A typical approach to writing an API or service in NodeJS would be to use http://expressjs.com/.
Express let's you defined some endpoints and some code to respond to those endpoints.
You can deploy an Express app anywhere where a HTTP port is open and NodeJS is running.

Some common deployment strategies:

- Heroku
- Google App Engine
- Amazon Elastic Compute Cloud
- Microsoft Azure
- Zeit now

All these strategies involve running a server for you that simply directs HTTP traffic to your Express app.
Express itself will turn that HTTP traffic into calls to your particular endpoints via its routing functionality.

If your server is under a lot of load you can increase the number of servers and have each server handle its own set of requests.
This is called load balancing, some cloud providers do this automatically for you.

For most cases you don't need to worry about "scale".  The above approach works for the majority of cases and you should feel
confident taking this approach.  If you feel like replacing Express with another HTTP framework like Hapi, that's great too.

But there are other strategies that involve architectural infrastructure changes that make load balancing and scaling a lot less painful.  There are other benefits to these strategies, namely performance and security, but there is also a potential for complexity.

We are going to explore micro services.

Amazon Lambda
-------------

#### Overview

- Amazon Lambda gives you a new server for every request, it automatically scales.
- Serverless is a command line api that makes deploying Lambda functions a lot less painful
- ClaudiaJS is a high level framework for building applications on top of Lambda

Despite the fact that using anything Amazon is generally a horrible experience; Lambda is pretty incredible.

Where Express would have us handle all requests on a single server,  Lambda is like spinning up a new server for every request. 
You pay only for what you use and it is billed to the second.  Lambda was originally marketed as a lightweight approach to handle server side jobs like image processing.  But in conjunction with Amazon's API Gateway, you can use Lambda to write a typical REST API.

Using Lambda isn't exactly ergonomic.  Deploying involves creating a zip file of your code and uploading it to an s3 bucket, and then tell Amazon your code lives in that zip file.  You can automate it via the Amazon API either on the command line or in Node, but its a lot more complicated than you'd expect.  There's several calls you'll need to make for each step.  I wrote my own deployment code
for work and it wasn't fun, I would not wish writing deployment code on anyone - thankfully **serverless** has written one for us.

https://serverless.com/ is a framework for simplifying development of Lambda's, where usually your doing a lot of API calls to manage deployment, serverless is more like an npm workflow.  You have a config file that describes your service and when you deploy, serverless will make the necessary api calls for you.

If you are writing backend jobs, message queues, data processing etc, serverless takes away the complexity of deployment without telling you how to write your code.  Its fairly unopinionated about everything other than deployment.  Its possible to write API's via serverless, but its still fairly low level.  Serverless is filling the niche Amazon created by not caring about user experience.

Claudia is a bit like serverless but more opinionated. Claudia has plugins for specific use cases, and if you fall into those use cases its pretty effortless.  In our case we are building an api; we can use [claudia-api-builder](https://github.com/claudiajs/claudia-api-builder), which gives us an express like api; but instead of deploying your api to run on a server and wait for requests, you are associating a function that will be run whenever someone makes a request to a particular endpoint.  

> Claudia's API builder is designed to have a single lambda respond to a single endpoint, which is a pattern we will revisit.

If one endpoint gets a lot of load, more lambdas spin up. If there's no load, nothing runs. The whole "scaling" issue is automated.  Set and forget.

Micro services without Lambda
-----------------------------

- You can manage load by spreading it out across endpoints
- You can do that with express
- zeit/micro is specifically built for deploying endpoints as apps on persistent servers

Another strategy is to continue to deploy our app to the same providers as our Express app, but to deploy each endpoint as an individual application.  We can then join these individual services together via a DNS service like Amazon's Route53, Amazon API Gateway, Zeit World or even just your web hosting interface.

We could use Express to do this, we'd just define a single endpoint per app and deploy.  There is nothing stopping you from deploying a single endpoint Express application.

https://github.com/zeit/micro is worth mentioning.  Micro is designed to deploy to an always on server, but its 1 server per endpoint, which means there is a lot in common with claudia.  Where claudia-api-build runs on Lambda, Micro runs on typical 3rd party servers.  Micro is ultra opinionated, it makes lot of good assumptions about how to structure your microservice. Zeit generally prioritizes developer workflow, and Micro follows the same trend.

You can deploy a micro app to heroku, or zeit, or even ec2.  You're not really tied to any provider as its just a layer on top of the standard node HTTP stack.  Zeit's now service: https://zeit.co/now includes a command `now alias` that makes managing aliasing endpoints to your public facing API trivial.

Express: still cool
-------------------

This post is meant to be a high level conceptual overview of some emerging technologies.  But in the days of tech stack exhaustion
I think it needs to be restated, Express is a great framework, and running a persistent server on services like Heroku is a great dev experience with loads of benefits.  Scaling isn't super hard on most providers (and on some providers it is super simple).

If you are getting started with server side code, I recommend Heroku + Express.  There's a brilliant introduction to using Node on Heroku https://devcenter.heroku.com/articles/getting-started-with-nodejs, after finishing that tutorial I think you'll feel confident branching out and trying other things.  Heroku and Zeit are competitive when it comes to ergonomics and workflow.  And I only recommend Heroku because they have a lot more documentation than zeit (at the moment).  Heroku and zeit are both built on top of standards which means you have almost zero work to run the same app on zeit and heroku simultaneously, there is no platform lock in.

For hobby and open source projects Zeit and Heroku are essentially free.  But for commerical projects Lambda and EC2 are generally the cheapest way to run your code in the cloud.  Though Amazon is cheaper at face value, there is a hidden development cost that includes tearing your hair out while reading their documentation, setting up authentication / permissions and using their web interface generally.  Keep in mind Heroku and zeit.now are built on top of Amazon for a reason.

That's it, have fun writing servers!
