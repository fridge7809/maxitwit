---
title: DevOps, Software Evolution & Software Maintenance
subtitle: Group P - Maxitwit
author: |
    | Andreas Andrä-Fredsted - aandr@itu.dk
    | Bence Luzsinszky - bluz@itu.dk
    | Christian Emil Nielsen - cemn@itu.dk
    | Michel Moritz Thies - mithi@itu.dk
    | Róbert Sluka - rslu@itu.dk 
date: 2024
toc: true
toc-depth: 3
include-before: |
    \maketitle
    \newpage
---

\newpage
# Abstract {-}

This report details the transformation of Maxitwit, initially a Python-Flask application, into a JavaScript-based platform utilizing Node.js, Express, and Pug. The transition was guided by DevOps principles, incorporating Docker Swarm and DigitalOcean for deployment and hosting. Key components include a PostgreSQL database and monitoring with Prometheus and Grafana. The refactoring emphasizes modern software practices and the project's adaptive strategies in architecture, deployment, and maintenance for enhanced performance and scalability.

# System Perspective

## Architecture

When we took over the minitwit application at the beginning of the course we started by evolving it away from Python using Flask and replacing it with Javascript using Node.js, Express and Pug. The group decided to do the rewrite in Javascript as all members were already familiar with it to varying degrees and because of the good ecosystem which offers tools for everything we need in this web application.

### Description of Components

#### Frontend

\
The frontend of our maxitwit application consists of HTML and CSS which is being rendered using the Pug templating engine. The frontend handles user input and sends requests to the express server while also displaying all data it receives as response. The frontend is rendered on the server and there is no javascript running on the client to render the GUI.

#### Backend API

\
We decided to use Node.js as it is the most popular and mature runtime environment for building fast and scalable server side applications in Javascript.

Instead of writing the server side logic completely from scratch we decided to use the Express framework as it comes with a number of useful features for developing robust server-side applications. Using the Express framework we have a minimal yet flexible framework that provides middleware support, so middleware functions can be used to handle HTTP requests and responses, as well as Route Handling allowing us to define routes for a number of HTTP methods such as GET, POST, PUT, DELETE and the corresponding url patterns.
Furthermore it offers a number of HTTP Utilities to simplify sending responses and accessing request data.
Another useful feature for us is the static file serving provided by the framework which we use to serve our CSS styles. To render our HTML content dynamically Express also offer template engine support, in our case for Pug. Finally the good support for Error Handling in the framework is essential when developing and maintaining complex application logic.


#### Database

\
When we first started working with the application it had an SQLite database for data storage which we used for the first weeks of the course. We then added the ORM, Prisma, which provided an abstraction layer over the database. We decided on Prisma as our ORM because of the efficient and clean communication it enabled us to have between the database and the backend API and because the schema driven approach would ensure data integrity.
After adding the ORM we were tasked with migrating away from SQLite to another database for which we decided on PostgreSQL as all team members are familiar with it from the Introduction to Database Systems course, which we were all taking this semester. We also chose Postgres as it allows us to improve the perfromance of our application, especially as the database grew to a large data set and because we could easily scale PostgreSQL horizontally if we needed to.

## Dependencies

We generated a [dependency graph](https://github.com/DevOps-2024-group-p/maxitwit/blob/feature/report/report/images/dependency_graph.svg) for our node dependencies.

![Snyk screenshot](./images/Snyk_report.png)

For identifying and fixing vulnerabilities, we used Snyk, which provided us with detailed reports on a weekly basis. These potential vulnerabilities were categorized based on their severity and then addressed. However, not all of them have been resolved, such as [inflight](https://security.snyk.io/vuln/SNYK-JS-INFLIGHT-6095116), which appears to no longer be maintained, and therefore, no current fix is available.


## Viewpoints

### Module Viewpoint

To effectively capture this, the following class diagram presents the components of the web-app mapped to their respective dependencies.

```{.mermaid #fig:Module caption="Module Viewpoint"}
classDiagram
    direction RL

    class Monitoring
    class Logging-System
    class Database-System


    class Domain-Model {
        ExpressJS[
            +views
            +routes
            +prisma
            +services
        ]
    }
    
    class API-endpoint
    class GUI-endpoint

    Monitoring "1"--"*" Domain-Model : makes accessible
    Logging-System "1"--"1" Domain-Model : sends data
    Database-System "1"--"*" Domain-Model : updates

    Domain-Model --* API-endpoint : provides
    Domain-Model --* GUI-endpoint : provides
  

    API-endpoint : recieves HTTP requests 
    GUI-endpoint : recieves HTTP requests 

    Logging-System : Fluentd
    Logging-System : Syslogs

    Monitoring : Prometheus
    Monitoring : Grafana

    Database-System : PostgreSQL
```

The above module viewpoint highlights how the expressjs application interacts with numerous systems with some being
dependencies required for the running of the application, such as the postgres database, while others are tools meant for
tasks such as monitoring and logging. What is not covered in this illustration is the framework in which the application is run and managed,
which is covered in the following viewpoints.

### Deployment Viewpoint

Our application is deployed on a Digital Ocean droplet. The droplet is running a Docker Swarm with one manager and two worker nodes. We use an Nginx reverse proxy to route the incoming requests and monitoring is also running in a separate droplet. In total we have 5 droplets and a database running on Digital Ocean.

```{.mermaid #fig:Deploy caption="Deployment Viewpoint"}
flowchart LR

    subgraph "Digital Ocean"
    
        PROXY["Proxy"] --- SM["Swarm-Manager"]
        SM --- SW1["Worker1"]
        id1[("Postgres DB")] ---|Prisma| SW1
        id1 ---|Prisma| SW2
        SM --- SW2["Worker2"]
        SW1 --- |Prometheus|Monitoring
        SW2 --- |Prometheus|Monitoring

    end
    DO["User"] --- |HTTPS REQUEST| PROXY 

```

We chose Digital Ocean because Github Education provides 200$ in credits for students, which was enough to cover the costs of the droplets and the database for the duration of the project.

## Important interactions

The system can be interaceted with in two ways:

* [User Interface](https://maxitwit.tech)
* [API for the simulator](https://api.maxitwit.tech)

The main interaction with the system is via an API, that is built for a simulator. The simulator sends HTTP requests to our endpoints to simulate a user registering, following, unfollowing and tweeting. The API uses Prisma to interact with the Postgres database. Prisma is an ORM that generates SQL queries based on the schema defined in the [Prisma schema file](https://github.com/DevOps-2024-group-p/maxitwit/blob/feature/report/prisma/schema.prisma).

We chose prisma because it is a modern ORM that is easy to use and has a lot of features that make it easy to interact with the database.

```{.mermaid #fig:Interaction caption="Simulator Interaction"}
sequenceDiagram
    autonumber
    actor Simulator
    participant API
    participant Prisma Client
    participant Postgres DB
    Simulator->>+API: Sends automated HTTP requests<br>Register, Follow, Unfollow, Tweet
    API->>-Prisma Client: Processes and sends data
    activate Prisma Client
    Prisma Client->>+Postgres DB: Saves into DB based on schema 
    deactivate Prisma Client
    Postgres DB->>Postgres DB: Stores data <br>Generates unique ID
    Postgres DB-->>-Prisma Client: Sends response
    activate Prisma Client
    Prisma Client-->>+API: Sends response
    deactivate Prisma Client

    API-->>-Simulator: Sends HTTP response 
```

## Current State

![Sonarcloud screenshot](./images/sonarcloud.png)

The application is practically fully functional, apart from a single outstanding [bug](https://github.com/DevOps-2024-group-p/maxitwit/issues/42). While the application has [minimal technical debt](https://sonarcloud.io/summary/overall?id=fridge7809_maxitwit), it relies on legacy code and dependencies to test the application (test suite and simulator). The project has a couple of [outstanding](https://github.com/DevOps-2024-group-p/maxitwit/pull/150) [PR's](https://github.com/DevOps-2024-group-p/maxitwit/pull/155) that fixes the most relevant cwe's. Overall, the quality of the code base is high, with minimal technical debt.

# Process Perspective


## Monitoring
Inside the application droplets, prometheus has a volume storing it's state, such that the cd pipeline would not reset monitoring. We use Prometheus to generate metrics for our monitoring and Grafana to visualize them. We made this decision because with this setup we can easily make relevant and informative [dashboards](http://144.126.246.214:3002/public-dashboards/2c37eba9cf8c494c83490b90f89e116f?orgId=1) representing the state of our system.

## Database Migration
During the semester we had the task to migrate from SQLite to a database of our choice. We chose Postgres to supplement our studies in Introdutcion to Database Systems course that we are having paralelly.

## Branching strategy

```{.mermaid #fig:Git caption="Git Branching Strategy"}

%%{init: { 'logLevel': 'debug', 'theme': 'base', 'gitGraph': {'showBranches': true, 'showCommitLabel':true,'mainBranchName': 'release'}} }%% 
    gitGraph
        commit tag: "v1.4.0" id:" "
        branch main
        checkout main
        branch feature
        checkout feature
        commit id: "feat: add new feature"
        commit id: "test: test new feature"
        commit id: "docs: update README"
        checkout main
        merge feature
        checkout release
        merge main tag: "v1.4.1"
        branch fix
        checkout fix
        commit id: "fix: fix bug"
        checkout main
        merge fix
        checkout release
        merge main tag: "v1.4.2"
```

The chosen branching strategy loosely follows the [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) workflow. We chose to omit hotfix branches and merge the concept of a main/develop branch for simplicity. Committing to main or release is not allowed only pull requests.

Opening a pull request from a feature branch to main triggers the CI pipline.

Succesfully merging a pull request to the release branch triggers the CD pipeline. Release tag is bumped according to the contents of the release, using the [semantic versioning](https://semver.org/) protocol.

## Commit hooks

A pre-commit hook was added in [d40fcba](https://github.com/DevOps-2024-group-p/maxitwit/commit/d40fcba312eb082bda44bd220887f3d7574a7a40) to lint and enforce commit messages and to follow the [semantic versioning](https://semver.org/) protocol. A [CLI-tool](https://github.com/commitizen/cz-cli) was also [added](https://github.com/DevOps-2024-group-p/maxitwit/commit/44eec0ba28e7cad2000d6f1bcbf9db3c667b3862) to aid developers write commit messages that follows the chosen protocol. Effectively standardizing a common development process, improving our process quality and readability of the git log.

## CI/CD pipline

Our CI/CD pipleine is based on **Github Actions**. We have a [deploy.yml](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/.github/workflows/deploy.yml) file that is automatically triggered when new data is pushed to the **release branch**.

```{.mermaid #fig:CICD caption="CI/CD Pipeline"}
flowchart LR
        id0("Prepare")-->id1("Build and Push")
        id1-->id2("Test")
        id2-->id3("Set up VM")
        id3-->id4("Deploy")

        style id0 stroke:#FFDB5C, stroke-width:3px, fill:#FFFFFF
        style id1 stroke:#5AB2FF, stroke-width:3px, fill:#FFFFFF
        style id2 stroke:#7ABA78, stroke-width:3px, fill:#FFFFFF
        style id3 stroke:#FFBB70, stroke-width:3px, fill:#FFFFFF
        style id4 stroke-width:3px, fill:#FFFFFF
```

We prepare the workflow by checking out to our release branch, logging in to Docker Hub and setting up Docker Buildx so the workflow can build the images.

```mermaid

flowchart TB
    subgraph P["Prepare the workflow"]
        id0("Checkout")-->id1("Login to Docker Hub")
        id1-->id2("Set up Docker Buildx") 
    end
    
    style P stroke:#FFDB5C, stroke-width:3px, fill:#FFFFFF
```

Th workflow builds our images and pushes them to Docker Hub.

```mermaid
flowchart TB
    subgraph B["Build and Push to Docker Hub"]
        id0("Maxitwit server")-->id1("Maxitwit api")
        id1-->id2("Maxitwit test")
        id2-->id3("Fluentd image") 
    end

    style B stroke:#5AB2FF, stroke-width:3px, fill:#FFFFFF
```

Snyk is run to check for vulerabilities. After the workflow builds our images and runs our tests suite against them.

```mermaid
flowchart TB
    subgraph T["Test"]
        id0("Run Snyk")-->id1("Test maxitwit")
    end

    style T stroke:#7ABA78, stroke-width:3px, fill:#FFFFFF
    classDef goodFont font-size:10px;
    class id1 goodFont;
    class id0 goodFont;
```

The environment variables stored in GitHub Actions Secrets are given to the workers and the most recent [/remote_files](https://github.com/DevOps-2024-group-p/maxitwit/tree/main/remote_files) are copied with SCP to the Swarm Manager.

```mermaid
flowchart TB
    subgraph S["Set up VMs"]
        id0("Configure SSH")-->id1("Provision env vars to Workers")
        id1-->id2("Provision /remote_files to Swarm Manager")
    end

    style S stroke:#FFBB70, stroke-width:3px, fill:#FFFFFF
```

Finally we SSH onto the Swarm Manager and run the [deploy.sh](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/remote_files/deploy.sh) script to pull and build the new images.

## Monitoring

We use Prometheus and Grafana for [monitoring](http://144.126.246.214:3002/d/c8583637-71f4-4803-a0ed-f63485c5c3e6/group-p-public-dashboard?orgId=1&from=1715001375446&to=1715004975446).
There are multiple metrics set up in our backend, that are sent to /metrics enpoint on our both our [GUI](https://maxitwit.tech/metrics) and the [API](http://api.maxitwit.tech/metrics).
Prometheus scrapes these endpoints and Grafana visualizes the data.

We set up a separate Droplet on DigitalOcean for monitoring, because we had issues with its resource consumption. The monitoring droplet runs Prometheus and Grafana, and scrapes the metrics from the Worker nodes of the Docker swarm.

## Logging

The Logging system started out as a simple [logger](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/src/services/logger.js) using the `winston`  npm package for the logging-client and the `morgan` npm package as middleware to interface with [express.js](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/src/app.js). To make logging system scale in a distributed context, the logger was reconfigured to send the gathered logs to a [fluentd instance](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/remote_files/fluentd.conf) listening on port 24224, which then send the logs to be stored in the same droplet containing the load balancer.

Fluentd specifically was chosen over other similar alternatives such as Logstash for it's provided flexibility and integration with [other services](https://www.fluentd.org/plugins?ref=porthit.com), as the decision whether to integrate logging into elasticsearch had not been made at the time. Thus, Fluentd provided a scalable solution that could fit with multiple evolution paths.

## Security Assesment

A severe vulnerability we found is that many of our containerized services executed process as root. This included images that ran in our CI/CD pipeline. This is a security risk because it violates [PloP](https://www.paloaltonetworks.com/cyberpedia/what-is-the-principle-of-least-privilege).
 
According to the documentation that can be found [Restricitons to ssh](https://superuser.com/questions/1751932/what-are-the-restrictions-to-ssh-stricthostkeychecking-no), we are aware that setting the flag for StrictHostKeyChecking to "no", might result in malicious parties being able to access the super user console of our system. Setting it to yes would prevent third parties from entering our system and only known hosts would be able to.
 
[NPM](https://www.npmjs.com/) was used to manage and audit dependencies with security vulnerabilities with `npm audit`. It was a challenge to upgrade certain dependencies, either because they were bundled or because they create cyclic dependencies. We generated a [dependency graph](https://github.com/DevOps-2024-group-p/maxitwit/blob/feature/report/report/images/dependency_graph.svg) for our dependencies.

## Scaling strategy

We used Docker Swarm for horizontal scaling. The strategy is defined in [compose.yml](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/remote_files/compose.yaml).
One manager node is responsible for the load balancing and the health checks of two worker nodes, 
each node having 6 replicas.
We update our system with rolling upgrades. The replicas are updated 2 at a time, with 10s interval between the updates. The health of the service is monitored every 10s. If the service fails, it will be restarted with a maximum of 2 attempts.

## AI and LLM's

LLM's were very useful tools in the refactoring process. We found that AI tools work best when you can provide extensive context as a prompt. However, sometimes gathering all the context needed for a prompt was wasted cognitive load if they didn't provide a useful response. Especially when debugging niche interactions between system components, LLM's were not very helpful.

# Lessons Learned

## Evolution and refactoring

### State in a Load Balanced System

A hindrance to the application running in a distributed environment, such as Docker Swarm, is the configuration of the session handling. Currently, it is done using the express-session npm package, which was set up to use a locally stored sqlite database. This means that users would get their sessions dropped/logged out if their requests got directed to a node in the swarm that did not contain the database. To fix this issue, we discussed ways to manage session-handling using our managed postgres database to handle user sessions instead. This would however require refactoring of the session-handling to use a foreign database.

### Implementation of Logging

The implementation of the logging system proved difficult, as storing logs locally in the application did not scale in a docker swarm network. We attempted to expand on the system by adding a fluentd container as a global service in the swarm so it would run on each node in the swarm. The service would recieve the logs from the containers and then send them all to a centralized storage droplet running elasticsearch and kibana. This proved infeasable given the [hardware specification](https://www.elastic.co/guide/en/cloud-enterprise/current/ece-hardware-prereq.html) of Elasticsearch, as it kept crashing due to memory issues. To provide centralized logs, we defaulted to have fluentd send logfiles to the droplets running the load balancers. Overall, choices made early on in the project made the refactoring required for a centralized logging system too expansive.

### Database Migration

The Database Migration task proved a challenge, as many issues arose in the process, such as namespaces and types not being compatible with Postgresql.
Specifically, the TIMESTAMP type in sqlite proved difficult, as postgres stores timestamps as integers.

Firstly, we tried to modify the sql dump using different regex, `sed` commands and [bash scripts](https://github.com/DevOps-2024-group-p/maxitwit/issues/49), and then using an ssh connection to run the script against the postgresql droplet. This proved fatal however, as the script had not finished running after five hours due to each insert statement requiring a new connection. Furthermore, the process failed due to conflicting id's between the insert statements and postgres.

Finally, a solution was found in the shape of a pythonscript, which represented insert statements as classes, where each attribute in the insert statement was modified in the constructor of the class to match the postgresql schema. The script then aggregated insert statements, allowing us to run 1000 insert statements per connection. Thus, the migration was completed in five minutes.

This experience showed us that even with abstraction layers, such as prisma, unique issues related to our migration occured which necessitated the development of a specific solution.

## Operation

During the last week of the simulator being active, our application crashed which we ended up not noticing.
The reason for the crash, which became clear when inspecting the docker logs, was that a misconfiguration in Fluentd
stopped the API- and GUI- containers from running, thereby bringing the entire application to a standstill.
The issue seemed to be that Fluentd was not configured to deal with some of the formats generated by the [logging-client](https://github.com/DevOps-2024-group-p/maxitwit/blob/main/src/services/logger.js) certain logs.
Furthermore, it was trivial to solve when we became aware of it, as it only required a slight modification in how logs were [matched and transported](https://github.com/DevOps-2024-group-p/maxitwit/pull/108) out of fluentd. Our monitoring system failed to inform us of this crash, which was caused by Prometheus having crashed around the same time. Thus, a set of systems set up to monitor and log the system had failed with no relation to eachother, allowing for the issue to go unnoticed.

## Maintenance

### Issues with monitoring

Our inbuilt metrics for prometheus turned out to be [very resource demanding](https://github.com/DevOps-2024-group-p/maxitwit/issues/83). Starting the Prometheus container would instantly max out system resource usage in the droplet. This was solved by reducing the unnecesarry metrics and moving the Monitoring to its own droplet.

### Maintaining a performant DB

We noticed the performance of the public timeline endpoint getting slower as the database grew. To remedy this, we [wrote a shell script](https://github.com/DevOps-2024-group-p/maxitwit/blob/fd72ed600e3e7d8e6e8a5d96885e52b495a0b85e/sql/grab_perf_stats.sql) to query the performance table of our production database to [identify which relations needed indices](https://github.com/DevOps-2024-group-p/maxitwit/pull/79).
