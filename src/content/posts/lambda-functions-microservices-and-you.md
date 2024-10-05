---
title: Lambda Functions, Microservices and You
created: 2016-12-28
archived: true
featured: false
---

Ye olde Express
---------------

A typical approach to writing an API or service in NodeJS would be to use http://expressjs.com/.
Express let's you define functions that respond to endpoints you define.  Express manages converting HTTP requests into
particular routes.  It does many other things like oauth middleware, JSON parsing etc but its core functionality is 
routing the HTTP layer into a series of endpoint actions.

You can deploy an Express app anywhere where a HTTP port is open and NodeJS is running.

Some common 3rd party products for hosting include:

- Heroku
- Google App Engine
- Amazon Elastic Compute Cloud
- Microsoft Azure
- Zeit now

All these strategies involve running a server for you that simply directs HTTP traffic to your Express app.
If your server is overloaded you can increase the number of servers, then have each server handle a subset of requests.
This is called load balancing, some cloud providers do this automatically for you.

There are other strategies that involve architectural infrastructure changes that make load balancing and scaling a lot less painful.  
These strategies potentially add complexity but come with benefits to performance, cost and security.

> A process' ability to manage variable traffic is often referred to as scaling.  At this point it has become a bit overloaded and means
different things to different people.  For most cases you don't need to worry about scaling or "scale" at all.  

One strategy is to host each endpoint on a new server where the server can be either persistent or ephemeral.

Each approach has tradeoffs, so its important to note that the standard approach of hosting express apps on a compute platform is
a still a solid choice.  If you feel like replacing Express with another HTTP framework like Hapi, that's great too.

I simply want to draw attention to other potential solutions.


Amazon Lambda
-------------

#### Overview

- Amazon Lambda gives you a new server for every request, it automatically scales but its painful to configure.
- Serverless is a command line api that makes deploying Lambda functions a lot less painful
- ClaudiaJS is a high level framework for building applications on top of Lambda

Despite the fact that using anything Amazon is generally a horrible experience; Lambda is pretty incredible.

Where Express would have us handle all requests on a single server; Lambda is like spinning up a new server for every request. 
You pay only for what you use and it is billed to the second.  
Lambda was originally marketed as a lightweight approach to handle server side jobs like image processing.  
But in conjunction with Amazon's API Gateway, you can use Lambda to write a typical REST API.

However, using Lambda isn't exactly ergonomic.

Deploying involves 

1. creating a zip file of your code 
2. uploading it to an s3 bucket
3. Informing Amazon your code lives in that zip file via 1 or more API calls.

You can automate it via the Amazon API either on the command line or in Node, but it's a lot more complicated than you'd expect.
Maybe that doesn't sound so bad, but there are different calls for updating different aspects of the lambda, and its very easy to 
create a deployment process with holes in it.

I would not wish writing deployment code on anyone - thankfully someone has written one for us.

https://serverless.com/ is a framework for simplifying development of Lambda's.  
It fills a niche Amazon created by not caring about user experience.

Serverless takes away the complexity of deployment without prescription.  
It's fairly unopinionated about everything other than deployment.  
Serverless will allow you to a lot more than write API's, other than deployment its still fairly low level.

Claudia is like an opinionated serverless. 
Claudia has plugins for specific use cases, and if you fall into those use cases its pretty effortless.  

In our case we were building an api. 
[claudia-api-builder](https://github.com/claudiajs/claudia-api-builder) gives us an express like api that is designed to run on Lambda.

The key difference between express and claudia is the target infrastructure.  
Express is designed to run on a single server and wait for requests.
Claudia is associating a function to run on a new lambda whenever someone makes a request to a particular endpoint.

> Claudia's API builder is designed to have a single lambda respond to a single endpoint, which is a pattern we will revisit.

If one endpoint is overloaded, more lambdas spin up. If there's no load, nothing runs.  
Scaling is automated.  
Set and forget.

Micro services without Lambda
-----------------------------

- You don't need Lambda to write micro services
- You can manage load by spreading it out across endpoints
- You can do that with express
- zeit/micro is specifically built for deploying endpoints as apps on persistent servers

Another strategy is to continue to deploy our app to the same hosting providers as our Express app - but deploy each endpoint as an individual application.
We can then join these individual services together via a DNS service like Amazon's Route53, Amazon API Gateway, zeit world or a web hosting interface.

We could use Express to do this, just define a single endpoint per app and deploy.  
There is nothing stopping you from deploying a single endpoint Express application.

But https://github.com/zeit/micro is worth mentioning.  
Micro is designed to deploy to an always on server, where that 1 server responds to only 1 endpoint.  
There is a lot in common with claudia except claudia-api-build runs on Lambda and micro runs on typical 3rd party servers.  
Micro is ultra opinionated, it makes lot of good assumptions about how to structure your microservice.  
Zeit generally prioritizes developer workflow, and micro follows the same trend.

You can deploy a micro app to heroku, or zeit, or even ec2.  
You're not really tied to any provider as it's just a layer on top of the standard node HTTP stack.  
Zeit's now service: https://zeit.co/now includes a command `now alias` that makes aliasing endpoints to your public facing api trivial.

Express: still cool
-------------------

This post is meant to be a high level conceptual overview of some emerging technologies.  
But in the days of tech stack exhaustion I think it needs to be restated: Express is a great framework.  
Running a persistent server on services like Heroku is an incredible workflow with loads of benefits.  

Scaling isn't super hard on most providers (and on some providers it is a single command).

If you are getting started with server side code, I recommend Heroku + Express.  
There's a brilliant introduction to using Node on Heroku here: https://devcenter.heroku.com/articles/getting-started-with-nodejs.  
After finishing that tutorial I think you'll feel confident branching out and trying other approaches / strategies.  

Heroku and Zeit are competitive when it comes to ergonomics and workflow.  
I only recommend Heroku because they have a lot more documentation than zeit (at the moment).  
Heroku and zeit are both built on top of standards.  One has almost zero work to deploy a heroku app on zeit and vice versa.  
There is no platform lock in.

For hobby and open source projects Zeit and Heroku are essentially free.  
But for commerical projects Lambda and EC2 are generally the cheapest way to run your code in the cloud.  
Amazon is cheaper at face value because there is a hidden development cost that includes tearing your hair out while 
reading their documentation, setting up authentication / permissions and using their web interface generally.  
Keep in mind Heroku and zeit.now are built on top of Amazon for a reason.

That's it, have fun writing servers!
