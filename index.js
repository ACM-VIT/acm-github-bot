const firebase = require("./config")
var fdb = firebase.database();

const labels = {
}

const scores = {
  "issue": 5,
}

async function updateDB(username, finalScore, issues, issues_urls, pullRequests, pullRequests_urls) {
  const snapshot = await fdb.ref("Scores").once("value")
  last_score = snapshot.child(username + "/finalScore").val();
  last_score = last_score ? last_score : 0;
  last_issues = snapshot.child(username + "/issues").val();
  last_issues = last_issues ? last_issues : 0;
  last_issues_urls = snapshot.child(username + "/issues_urls").val();
  last_issues_urls = last_issues_urls ? last_issues_urls : [];
  last_pullRequests = snapshot.child(username + "/pullRequests").val();
  last_pullRequests = last_pullRequests ? last_pullRequests : 0;
  last_pullRequests_urls = snapshot.child(username + "/pullRequests_urls").val();
  last_pullRequests_urls = last_pullRequests_urls ? last_pullRequests_urls : [];

  if (last_pullRequests_urls.includes(pullRequests_urls)) {
    return false;
  }

  if (last_issues_urls.includes(issues_urls)) {
    return false
  }

  last_issues_urls.push(issues_urls);
  last_pullRequests_urls.push(pullRequests_urls);


  let obj = {
    "finalScore": parseInt(last_score) + parseInt(finalScore),
    "issues": last_issues + issues,
    "pullRequests": parseInt(last_pullRequests) + parseInt(pullRequests),
  }
  if (last_issues_urls.length != 0) {
    obj["issues_urls"] = last_issues_urls
  }
  if (last_pullRequests_urls.length != 0) {
    obj["pullRequests_urls"] = last_pullRequests_urls
  }
  fdb.ref("Scores/" + username).set(obj)
  return true;
}


// set up router
module.exports = (app, { getRouter }) => {
  const router = getRouter("/api");
  const adminUsernames = ["yashkumarverma", "avats101", "akri16", "DarthBenro008", "HelixW", "vinamrak", "atg_coder27"];
  app.log.info("Yay, the app was loaded!");

  // issues opened
  app.on("issues.opened", async (context) => {
    const issue = context.payload.issue;

    // check if user is admin
    if (adminUsernames.includes(issue.user.login)) {
      app.log(
        `Ignoring new issue ${issue.id} created by admin ${issue.user.login}`
      );
      return;
    }

    // check if issue is opened
    if (!issue.closed_at) {
      app.log(`Issue Opened: ${issue.id}`);
      comment = context.issue({
        body: `Thanks @${issue.user.login}, for raising the issue!  🙌
  One of our team mates will revert on this soon. ✅`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  // issues labelled
  app.on("issues.labeled", async (context) => {
    const issue = context.payload.issue;

    let hact_labels = issue.labels.filter(obj => {
      if (obj.name == "hacktoberfest" || obj.name == "Hacktoberfest")
        return obj.name
    })

    if (hact_labels.length > 0) {

      // Update the scores
      if (await updateDB(issue.user.login, scores["issue"], 1, issue.url, 0, [])) {
        comment = context.issue({
          body: `This issue has been approved by the owner and is open to solve!\n@${issue.user.login} got ${scores["issue"]} points for this issue! 🎉`,
        })
        return context.octokit.issues.createComment(comment)
      }
    }
    return
  });

  // issues closed
  app.on("issues.closed", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for closing this issue!",
    });
    const issue = context.payload.issue;

    // check if user is admin
    if (adminUsernames.includes(issue.user.login)) {
      app.log(`Ignoring new issue ${issue.id} created by admin ${issue.user.login}`);
      return;
    }

    // let timeline = await context.octokit.rest.issues.listEventsForTimeline(issueComment)
    // let comment;

    // for (let i = 0; i < timeline.data.length; i++) {
    //   let e = timeline.data[i]
    //   if (e.event === "connected") {
    // let list = await context.octokit.rest.issues.listLabelsOnIssue(issueComment)
    // data = list["data"][0]

    // label = data.name

    // Update the scores
    // if (await updateDB(issue.user.login, 0, 0, [], 1, "PR")) {
    //   console.log("db updated...")
    //   comment = context.issue({
    //     body: `@${issue.user.login} got ${labels[label]} Points`,
    //   })

    // }
    // else {
    //   comment = context.issue({
    //     body: `PR already finalised!`,
    //   })
    // }
    // context.octokit.issues.createComment(comment)
    //     break
    //   }
    // }
    return context.octokit.issues.createComment(issueComment);
  });

  // pull request opened
  app.on("pull_request.opened", async (context) => {
    app.log("created PR");
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring new pr ${pr.id} opened by admin ${pr.user.login}`);
      return;
    }

    if (!pr.closed_at) {
      app.log(`Pull Request Opened: ${pr.id}`);

      comment = context.issue({
        body: `Thanks @${pr.user.login}, for opening the pull request!  🙌
  One of our team-mates will review the pull request soon. ✅`,
      });

      return context.octokit.issues.createComment(comment);
    }
  });

  app.on("pull_request_review_comment.created", async (context) => {
    const pr = context.payload.pull_request_review_comment;
    app.log(`Pull request linked ${pr}`);
  });

  // pr labeled
  app.on("pull_request.labeled", async (context) => {
    app.log("PR Labeled");
    const pr = context.payload.pull_request;

    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring new pr ${pr.id} opened by admin ${pr.user.login}`);
      return;
    }

    let labels = pr.labels
    let label;
    for (let i = 0; i < labels.length; i++) {
      label = labels[i].name
      console.log(label)
      if (label == "approved") {
        for (let j = 0; j < labels.length; j++) {
          let label_name = labels[j].name.split(" ")
          if (label_name[0] == "points") {

            let comment;

            // update the scores
            if (await updateDB(pr.user.login, label_name[1], 0, [], 1, pr.url)) {
              comment = context.issue({
                body: `@${pr.user.login} got ${label_name[1]} points for this pull request! 🎉`,
              })
            }
            else {
              comment = context.issue({
                body: `PR already finalised!`,
              })
            }

            context.octokit.issues.createComment(comment)

          }
        }
      }
    }



  });

  // pull request closed
  app.on("pull_request.closed", async (context) => {
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring pr ${pr.id} closing by admin ${pr.user.login}`);
      return;
    }
    if (!!pr.merged_at) {
      app.log(`Pull Request Closed: ${pr.id}`);

      comment = context.issue({
        body: `Congratulations @${pr.user.login}, your pull request is merged! 🎉 
  Thanks for your contributions. 🙌`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  // route for getting scores
  router.get("/scores", (req, res) => {
    fdb.ref('Scores').on('value', async function (snapshot) {
      let scores = snapshot.val()

      // sort the scores
      let sorted = Object.keys(scores).sort(function (a, b) {
        return scores[b].finalScore - scores[a].finalScore
      })

      let sorted_scores = {}
      sorted.forEach((value) => {
        sorted_scores[value] = scores[value]
      })
      return res.send(
        sorted_scores);
    });
  });
};




