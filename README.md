![ACM-HEADER](https://user-images.githubusercontent.com/14032427/92643737-e6252e00-f2ff-11ea-8a51-1f1b69caba9f.png)

<center><h1><b>Acm Github Bot</b></h1></center>
<p>
  <a href="https://acmvit.in/" target="_blank">
    <img alt="made-by-acm" src="https://img.shields.io/badge/MADE%20BY-ACM%20VIT-blue?style=for-the-badge" />
  </a>
</p>

## A GitHub App built with [Probot](https://github.com/probot/probot) to manage score distribution on Open Source Projects.

## Features
-  Greetings and Points scored would be commented only for contributers
-  For each new issue created by contributer, if the admin labels it as hacktoberfest  the contributer would be awarded with 5 points.
-  For Pull Requests by contributers, admin must add a label with format 'points 10' to award 10 points to the contributer. 
-  Only when approved label is added for the PR, the points will be awarded to the contributer.
-  Api with leaderboard can be used to get the scores in JSON format. 

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t acm-github-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> acm-github-bot
```

## Contributing

If you have suggestions for how acm-github-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).


## Authors

**Contributors:** [Swarup Kharul](https://github.com/SwarupKharul), [Ananya Grover](https://github.com/ananyagrover14) 


**Mentors:** [Yash Kumar Verma](https://github.com/YashKumarVerma), [Shreyash K](https://github.com/HelixW)

## License
Distributed under the MIT license. See LICENSE for more information.
