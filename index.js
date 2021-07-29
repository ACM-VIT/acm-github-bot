const firebase = require("./config")
const express = require("express")
var fdb = firebase.database();

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const labels = {
  "enhancement": 5,
  "bug": 10,
  "documentation": 50
}


module.exports = (app, { getRouter }) => {
  const router = getRouter("/my-app");

  const adminUsernames = [];
  app.log.info("Yay, the app was loaded!");

  //issues opened
  app.on("issues.opened", async (context) => {
    const issue = context.payload.issue;
    if (adminUsernames.includes(issue.user.login)) {
      app.log(
        `Ignoring new issue ${issue.id} created by admin ${issue.user.login}`
      );
      return;
    }
    if (!issue.closed_at) {
      app.log(`Issue Opened: ${issue.id}`);

      const comment = context.issue({
        body: `Thanks @${issue.user.login}, for raising the issue!  🙌
  One of our team mates will revert on this soon. ✅`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  //issues labelled
  app.on("issues.labeled", async (context) => {
    const issue = context.payload.issue;
    console.log(issue)
    const issueComment = context.issue({
      body: "This issue has been approved by the owner and is open to solve!"
    });
    let last_score, last_issues, last_pullRequests
    await fdb.ref("Scores").once("value", function (snapshot) {
      last_score = snapshot.child(issue.user.login + "/finalScore").val();
      last_issues = snapshot.child(issue.user.login + "/issues").val();
      last_pullRequests = snapshot.child(issue.user.login + "/pullRequests").val();
    })
    console.log(last_score);
    fdb.ref("Scores/" + issue.user.login).set({
      "finalScore": 5 + last_score,
      "issues": last_issues + 1,
      "pullRequests": last_pullRequests
    })
    const comment = context.issue({
      body: `@${issue.user.login} got 5 Points`,
    })
    context.octokit.issues.createComment(comment)
    return context.octokit.issues.createComment(issueComment);
  });

  //issues closed
  app.on("issues.closed", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for closing this issue!",
    });
    const issue = context.payload.issue;
    let timeline = await context.octokit.rest.issues.listEventsForTimeline(issueComment)
    // app.log(JSON.parse(JSON.stringify(timeline)))
    timeline.data.forEach(async (e) => {
      try {
        if (e.source.issue.pull_request) {
          // console.log(e.source.issue.pull_request)
          let list = await context.octokit.rest.issues.listLabelsOnIssue(issueComment)
          data = list["data"][0]
          try {
            label = data.name
            console.log(label)
            let last_score, last_issues
            await fdb.ref("Scores").once("value", function (snapshot) {
              last_score = snapshot.child(e.actor.login + "/finalScore").val();
              last_issues = snapshot.child(e.actor.login + "/issues").val();
              last_pullRequests = snapshot.child(e.actor.login + "/pullRequests").val();
            })
            console.log(last_score);
            fdb.ref("Scores/" + e.actor.login).set({
              "finalScore": labels[label] + last_score,
              "issues": last_issues,
              "pullRequests": last_pullRequests + 1
            })
            const comment = context.issue({
              body: `@${issue.user.login} got ${labels[label]} Points`,
            })
            context.octokit.issues.createComment(comment)
          }
          catch {
            app.log("Issue not labelled")
          }
        }
      } catch {
        console.log("error")
      }
    })
    return context.octokit.issues.createComment(issueComment);
  });

  //pull request opened
  app.on("pull_request.opened", async (context) => {
    app.log("created PR");
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring new pr ${pr.id} opened by admin ${pr.user.login}`);
      return;
    }
    if (!pr.closed_at) {
      app.log(`Pull Request Opened: ${pr.id}`);

      const comment = context.issue({
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

  //pull request closed
  app.on("pull_request.closed", async (context) => {
    const pr = context.payload.pull_request;
    if (adminUsernames.includes(pr.user.login)) {
      app.log(`Ignoring pr ${pr.id} closing by admin ${pr.user.login}`);
      return;
    }
    if (!!pr.merged_at) {
      app.log(`Pull Request Closed: ${pr.id}`);

      const comment = context.issue({
        body: `Congratualtions @${pr.user.login}, your pull request is merged! 🎉 
  Thanks for your contributions.🙌`,
      });
      return context.octokit.issues.createComment(comment);
    }
  });

  //rout for getting scores
  router.get("/scores", (req, res) => {
    fdb.ref('Scores').on('value', async function (snapshot) {
      app.log(snapshot.val())
      res.send(snapshot.val());
    });
  });
};




